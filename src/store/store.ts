import { configureStore } from '@reduxjs/toolkit'
import bookState from './slices/bookState'
import SyncedDataActions from './syncedActions'
import counterSlice from './slices/counterSlice'
import appState from './slices/appState'

import {enableMapSet} from "immer"
import { invoke } from '@tauri-apps/api'
import { LOADSTATE } from './slices/constants'
import { bookStateStructure } from './slices/EpubJSBackend/epubjsManager.d'
import {debounce} from '@github/mini-throttle'

enableMapSet()


const saveAppStateLocally = debounce((currentState:any)=>{
  invoke("set_global_themes", {payload:currentState.appState.themes})

  console.log(currentState.appState);
  invoke("set_settings", {payload:{
    
    selectedTheme: currentState.appState.selectedTheme,
    sortBy: currentState.appState.sortBy,
    sortDirection: currentState.appState.sortDirection,
    qaBotId: currentState.appState.qaBotId,
    qaBotApiKey: currentState.appState.qaBotApiKey
  }})

}, 500)


const store =  configureStore({
  reducer: {
    counter: counterSlice,
    appState,
    bookState
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        // This is done since the redux state will only be set once with the rendition and is an 'isolated app'
        // Isolated since state and react does not directly influence it's rendering. Only library calls do.
        // See:
        // https://redux.js.org/style-guide/#do-not-put-non-serializable-values-in-state-or-actions
        // https://redux-toolkit.js.org/usage/usage-guide#working-with-non-serializable-data
        // https://stackoverflow.com/questions/66733221/how-should-react-redux-work-with-non-serializable-data
        // Although it will break dev tools, and is against the recommendation of markerikson, I believe this approach
        // is "correct" enough
        ignoredActions: ['bookState/AddRendition', 'bookState/AddBookmark'],
        ignoredPaths: ['bookState.0.instance', 'bookState.1.instance', 'bookState.0.data.bookmarks', 'bookState.1.data.bookmarks']
      },
    }).concat(storeAPI => next => action => {
      console.log('dispatching', action);
      next(action)
      if(SyncedDataActions.has(action.type)){
        const currentState:RootState = storeAPI.getState()
        console.log("Current State: ", currentState);
        if(action.type.includes("bookState")){

          console.log("Synced bookState Action:", action)
          const renditionToHandle = action.payload.view
          if(renditionToHandle === undefined){
            console.log("Error: Could not save information for following payload")
            console.log(action.payload)
            return
          }
          const currentBook:bookStateStructure = currentState.bookState[renditionToHandle]
          const bookUID = currentBook.hash
  
  
          // Only save the data if the book is done with it's loading phase
          // During the loading phase, all sorts of synced actions will get called, but this is only the initial population,
          // And nothing here should be saved.
          if(window.__TAURI__ && currentBook.loadState == LOADSTATE.COMPLETE){
            if(!currentBook.data){
              return
            }
            if(currentBook.data.progress == null){
              console.log("Current progress null, returning")
              return
            }
            const saveData = {
              title: currentBook.title,
              author: currentBook.author,
              modified: Date.now(),
              data:{
                progress: currentBook.data.progress,
                cfi: currentBook.data.cfi,
                bookmarks: Array.from(currentBook.data.bookmarks),
                highlights: currentBook.data.highlights,
                theme:{...currentBook.data.theme}
              }
            }
            console.log("This is the save data: ")
            console.log(saveData)
            invoke("update_data_by_hash", {payload:saveData, hash: currentBook.hash})
          }

        }else if (action.type.includes("appState")){
          saveAppStateLocally(currentState)
        }
        

      }else{
        console.log("Warning: Action Unsaved: ", action.type)
      }
    }),
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

export default store