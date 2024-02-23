import React, { useEffect, useRef, useState } from 'react'
import ReaderView from './ReaderView/ReaderView'
import styles from './Reader.module.scss'

import Bookmark from '@resources/feathericons/bookmark.svg'
import List from '@resources/feathericons/list.svg'
import Search from '@resources/feathericons/search.svg'
import Settings from '@resources/feathericons/settings.svg'
import Maximize from '@resources/feathericons/maximize-2.svg'
import UnMaximize from '@resources/feathericons/minimize-2.svg'
import ArrowLeft from '@resources/feathericons/arrow-left.svg'
import ArrowRight from '@resources/feathericons/arrow-right.svg'
import HomeIcon from '@resources/feathericons/home.svg'

import Sidebar from './SideBar/SideBar'
import { useAppDispatch, useAppSelector } from '@store/hooks'
import { ToggleBookmark } from '@store/slices/bookState'
import SliderNavigator from './SliderNavigator/SliderNavigator'
import SettingsBar from './SettingsBar/SettingsBar'
import { useNavigate, useParams } from 'react-router-dom'
import Dictionary from './ReaderView/components/Dictionary/Dictionary'

import TitleBarButtons  from '@shared/components/TitleBarButtons';

import QuickbarModal from './ReaderView/components/QuickbarModal/QuickbarModal'
import NoteModal from './ReaderView/components/NoteModal/NoteModal'
import { HideFootnote, resetBookAppState, SelectSidebarMenu, ToggleMenu, ToggleProgressMenu, ToggleThemeMenu } from '@store/slices/appState'
import { appWindow } from '@tauri-apps/api/window'
import ProgressMenu from './ProgressMenu/ProgressMenu'
import FooterBar from './FooterBar/FooterBar'
import { platform } from '@tauri-apps/api/os';
import LLMChat from './ReaderView/components/LLMChat/LLMChat'
import { invoke } from '@tauri-apps/api'

const Home = () =>{
  const selectedRendition:number = useAppSelector((state) => state.appState.state.selectedRendition)
  const isDualReaderMode = useAppSelector((state) => state.appState.state.dualReaderMode)

  const menuOpen = useAppSelector((state) => state?.appState?.state?.menuToggled)
  const ThemeMenuActive = useAppSelector((state) => state?.appState?.state?.themeMenuActive)
  const renditionInstance = useAppSelector((state) => state.bookState[selectedRendition]?.instance)
  const bookmarks = useAppSelector((state) => state.bookState[selectedRendition]?.data.bookmarks)
  const displayedCFI = useAppSelector((state) => state.bookState[selectedRendition]?.data.cfi)
  const qaBotId = useAppSelector((state) => state.appState.qaBotId)
  
  const [isPageBookmarked, setPageBookmarked] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [mouseOverMenu, setMouseOverMenu] = useState(false)
  const [currentPage, setCurrentPage] = useState('')
  const [pdfExists, setPdfExists] = useState(false)
  const [threadId, setThreadId] = useState('')
  const [fileId, setFileId] = useState('')

  const threadIdRef = useRef(threadId);
  const fileIdRef = useRef(fileId);


  // Temporary Bug Fix: This is used as a fix for a Windows 11 tauri bug:
  // If the window is maximized, and then the fullscreen button is pressed
  // the window will not become fullscreen and the windows 11 UI will appear glitched.
  const [wasMaximized, setWasMaximized] = useState(false)



  const params = useParams()
  const sidebarOpen = useAppSelector((state) => state?.appState?.state?.sidebarMenuSelected)
  const dualReaderReversed = useAppSelector((state) => state?.appState?.state?.dualReaderReversed)
  const progressMenuActive = useAppSelector((state) => state?.appState?.state?.progressMenuActive)
  const footnoteActive = useAppSelector((state) => state?.appState?.state?.footnote.active)

  const ReaderBackgroundColor = useAppSelector((state) => {

    return state.appState.themes[state.appState.selectedTheme]?.reader?.body?.background

  })
  const ReaderColor = useAppSelector((state) => {

    return state.appState.themes[state.appState.selectedTheme]?.reader?.body?.color

  })

  const navigate = useNavigate();
  
  useEffect(()=>{
    if(renditionInstance){
      const pageTurnHandler = (e:any)=>{
        setCurrentPage(e.end)
      }
      renditionInstance.on("locationChanged", pageTurnHandler)

      return ()=>{
        renditionInstance.off("locationChanged", pageTurnHandler)
      }
    }

  }, [renditionInstance])


  useEffect(() => {
    threadIdRef.current = threadId; // Update ref whenever threadId changes
  }, [threadId]);

  useEffect(() => {
    fileIdRef.current = fileId; // Update ref whenever fileId changes
  }, [fileId]);
  
  useEffect(()=>{
    // TODO: Why is it bookHash1? Lol chumma copy paste...
    console.log("The book hash is " + params.bookHash1);
    if (qaBotId.length != 0) {
      invoke('check_pdf_exists', { bookHash: params.bookHash1 }).then((response) => {
        setPdfExists(true);
        // TODO: SERIOUSLY? That is your function name??
        invoke('upload_file_and_create_thread_llm', { bookHash: params.bookHash1 }).then((response) => {
          console.log("Thread created successfully");
          setThreadId(response.threadId);
          setFileId(response.fileId);
          console.log("Setting threadId to " + response.threadId);
          console.log("Setting fileId to " + response.fileId);
        }).catch((error) => {
          console.log("error in upload_file_and_create_thread_llm");
        });
      }).catch((error) => {
        console.log("error in check_pdf_exists");
      })
    }


    return ()=>{
      console.log("Unmounting");
      const currentThreadId = threadIdRef.current;
      const currentFileId = fileIdRef.current;
      console.log("The thread id is " + currentThreadId);
      if(currentThreadId.length > 0){
        console.log("Deleting thread");
        invoke('delete_thread', { threadId: currentThreadId, fileId: currentFileId }).then((response) => {
          console.log("Deleted :)")
        }).catch((error) => {
          console.log("error in close_thread");
        });
      }
    }
  }, [qaBotId]);

  useEffect(()=>{
    if(!bookmarks){
      return
    }
    if(renditionInstance.location && bookmarks.has(currentPage) ){
      setPageBookmarked(true)
    }else{
      setPageBookmarked(false)
    }
  },[bookmarks, currentPage])  


  const setFullScreenCaller = async (isFullScreen:boolean) =>{
    const currentlyMaximized = await appWindow.isMaximized()
    const OS = await platform()
    const useWorkaround = OS == 'win32'
    if(useWorkaround && isFullScreen == true && currentlyMaximized){
      setWasMaximized(true)
      await appWindow.unmaximize();
    }

    await appWindow.setFullscreen(isFullScreen);
    if(useWorkaround && isFullScreen == false && wasMaximized){
      setWasMaximized(false)
      await appWindow.maximize();
    }
    setIsFullScreen(isFullScreen);
    // Bug prevention: mouseOff event not detected when fullscreen is set. Menu state becomes glitched.
    setMouseOverMenu(false);
  };

  const dispatch = useAppDispatch()

  const showMenuUi = mouseOverMenu || menuOpen

  return (
    <div className={styles.readerFlex} style={{"backgroundColor":ReaderBackgroundColor, color: ReaderColor}} onClick={(e)=>{
      console.log(e.target)
    }}>

      <div onMouseLeave={()=>setMouseOverMenu(false)} onMouseOver={()=>setMouseOverMenu(true)} data-tauri-drag-region style={{backgroundColor:showMenuUi? "":ReaderBackgroundColor}} className={`${styles.readerTitleBar}`}>
        <div className={`${styles.menuButtonContainerLeft} ${!showMenuUi && styles.optionsToggled}`}>
          <HomeIcon viewBox="0 0 24 24" onClick={()=>{
            if(isFullScreen){
              setFullScreenCaller(false)
            }
            navigate('/')
            dispatch(resetBookAppState())
          }}/>
          <List viewBox="0 0 24 24" onClick={()=>{sidebarOpen?dispatch(SelectSidebarMenu(false)):dispatch(SelectSidebarMenu("Chapters"))}}/>
          <Bookmark viewBox="0 0 24 24" style={{fill:isPageBookmarked? "gold":'none', strokeWidth: 1}} onClick={()=>{dispatch(ToggleBookmark({view:selectedRendition, bookmarkLocation:renditionInstance.location.end.cfi}))}}/>
        </div>

        <div style={!showMenuUi?{color:ReaderColor, opacity:0.35}:{}} className={styles.title}>
          {renditionInstance?.book?.packaging?.metadata?.title}
          {/* - {displayedCFI} */}
          {/* - {selectedRendition} */}
        </div>
        <div className={`${styles.menuButtonContainerRight} ${!showMenuUi && styles.optionsToggled}`}>
          <Search viewBox="0 0 24 24" onClick={()=>{
            if(sidebarOpen){
              if(sidebarOpen == "Search"){
                dispatch(SelectSidebarMenu(false))
              }else{
                dispatch(SelectSidebarMenu("Search"))
              }
            }else{
              dispatch(SelectSidebarMenu("Search"))
            }
            
          }}/>
          <Settings viewBox="0 0 24 24" onClick={()=>{
            dispatch(ToggleThemeMenu())
            dispatch(ToggleMenu())
          }}/>
          {!isFullScreen?
            <Maximize viewBox="0 0 24 24" onClick={async ()=>{
              setFullScreenCaller(true)
            }}/>
            :
            <UnMaximize viewBox="0 0 24 24" style={isFullScreen && {marginRight:20}} onClick={async ()=>{
              setFullScreenCaller(false)
            }}/>}
          
          

          <TitleBarButtons disabled={!showMenuUi} remove={isFullScreen} />
        </div>
      </div>

      {/* This handles the case where the reader is now displayed, preventing a flash 
          These two elements id='reader-background' and <ReaderView> must be next to eachother in this order
          for page flipping logic found in registerHandlers.tsx
      */}
      <div style={{backgroundColor:ReaderBackgroundColor}} tabIndex={0} id="reader-background" className={styles.readerBackgroundFallback}/>
      <div className={styles.readerViewsContainer} style={isDualReaderMode?{gridTemplateColumns:"1fr 1fr"}:{gridTemplateColumns:"1fr"}}>
        <ReaderView view={!dualReaderReversed?0:1} contributesMountPoint={0} bookHash={params.bookHash1}/>
        {isDualReaderMode?<ReaderView view={!dualReaderReversed?1:0} contributesMountPoint={1} bookHash={params.bookHash2}/>:<></>}
      </div>

      <QuickbarModal/>
      <NoteModal/>
      <div onMouseLeave={()=>setMouseOverMenu(false)} onMouseOver={()=>setMouseOverMenu(true)} className={`${styles.readerFooterBar}  ${!showMenuUi && styles.optionsToggled}`}>
        <div onClick={()=>renditionInstance?.prev()} className={`${styles.arrowButtonContainer}`}>
          <ArrowLeft viewBox={"0 0 24 24"} />
        </div>
        <div onClick={()=>{
          dispatch(ToggleProgressMenu())
        }} className={styles.percentageContainer}>
          {renditionInstance? Math.round(renditionInstance.book.locations.percentageFromCfi(displayedCFI)*100):"0"}%
        </div>
        <div className={styles.sliderContainer}>
          <SliderNavigator/>
        </div>
        <div onClick={()=>renditionInstance?.next()} className={`${styles.arrowButtonContainer}`}>
          <ArrowRight style={{marginLeft:"auto", marginRight:"auto"}} viewBox={"0 0 24 24"}/>
        </div>

      </div>



      <Sidebar/>
      <SettingsBar/>
      <FooterBar/>
      <ProgressMenu/>
      <Dictionary/>
      <LLMChat threadId={threadId} pdfExists={pdfExists} fileId={fileId}/>


      <div onClick={()=>{

        if(sidebarOpen){
          dispatch(SelectSidebarMenu(false))
        }else{
          dispatch(SelectSidebarMenu(false))
        }
        if(ThemeMenuActive){
          dispatch(ToggleThemeMenu())
        }
        if(progressMenuActive){
          dispatch(ToggleProgressMenu())
        }
        if(footnoteActive){
          dispatch(HideFootnote())
        }
      }} className={`${styles.opaqueScreen} ${(sidebarOpen||progressMenuActive|| footnoteActive) && styles.opaqueScreenActive}`}/>

    </div>
  )
} 

export default Home

