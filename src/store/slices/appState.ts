import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { WritableDraft } from 'immer/dist/internal';
import {actions as globalThemeActions} from './AppState/globalThemes'
import {actions as stateActions} from './AppState/state/stateManager'
import { defaultAppState } from './appStateTypes';
import { BaseThemeDark, BaseThemeLight } from './AppState/globalThemes';
import { setThemeThunk } from './EpubJSBackend/data/theme/themeManager';
import {actions as modalActions} from './AppState/state/modals/modals';


export type appStateReducer = (state: WritableDraft<defaultAppState>, action: PayloadAction<any>) => any
export type appStateReducerSingle = (state: WritableDraft<defaultAppState>) => any


const initialState: defaultAppState = {
  themes:{
    "Default Dark":BaseThemeDark,
    "Default Light":BaseThemeLight
  },
  selectedTheme: "Default Light",
  sortBy:"title",
  sortDirection:"ASC",
  readerMargins: 75,
  // TODO: Better name
  qaBotId: "",
  qaBotApiKey: "",
  state:{
    localSystemFonts: {},
    maximized: false,
    selectedRendition: 0,
    dualReaderMode: false,
    dualReaderReversed: false,
    dictionaryWord: "",
    // TODO: Is this the right place?
    LLMInput: "",
    sidebarMenuSelected: false,
    menuToggled: true, 
    themeMenuActive: false,
    progressMenuActive: false,
    footnote:{
      active: false,
      text: "",
      link: ""
    },
    modals:{
      selectedCFI: "",
      quickbarModal: {visible: false, x:0, y:0},
      noteModal: {visible: false, x:0, y:0}
    }
  }
}

export const initialAppState = initialState

type SortPayload = {
  sortDirection:string,
  sortBy:string
}

export const appState = createSlice({
  name: 'appState',
  initialState,
  reducers: {
    // ...readerThemeActions,
    ...globalThemeActions,
    ...stateActions,
    ...modalActions,
    SetSortSettings:(state, action: PayloadAction<SortPayload>) =>{
      state.sortDirection = action.payload.sortDirection
      state.sortBy = action.payload.sortBy
    }
    

  },
  extraReducers(builder) {
    builder.addCase(setThemeThunk.pending, (state, action)=>{
      state.selectedTheme = action.meta.arg.themeName
    })
  },
})

// Action creators are generated for each case reducer function
export const { 
  // AddReaderTheme,
  // RenameReaderTheme,
  // LoadReaderThemes,
  // DeleteReaderTheme,
  // UpdateReaderTheme,
  /* Global Theme Actions */
  AddTheme,
  RenameTheme,
  DeleteTheme,
  UpdateTheme,
  setSelectedTheme,
  LoadThemes,

  SetMaximized,
  SetSortSettings,
  SetSelectedRendition,
  setReaderMargins,

  /* State */
  SelectSidebarMenu,
  CloseSidebarMenu,
  ToggleMenu, 
  SetDictionaryWord,
  SetLLMInput,
  SetQABotId,
  SetQABotApiKey,
  ToggleThemeMenu,
  SetDualReaderMode,
  resetBookAppState,
  SetDualReaderReversed,
  ToggleProgressMenu,
  SetFootnoteActive,
  HideFootnote,
  SetLocalFontsList,

  /* Modals */
  MoveQuickbarModal,
  HideQuickbarModal,
  MoveNoteModal,
  ShowNoteModal,
  HideNoteModal,
  SetModalCFI,
} = appState.actions

export default appState.reducer