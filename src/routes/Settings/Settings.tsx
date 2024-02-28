import React from "react"
import styles from './Settings.module.scss'

import BackArrow from '@resources/feathericons/arrow-left.svg'
import { Route, Routes, useLocation, useNavigate } from "react-router-dom"
// import ReaderTheme from "./pages/ReaderTheme"
import GlobalTheme from "./pages/GlobalTheme"
import Fonts from "./pages/Fonts/Fonts"
import TitleBarButtons from "@shared/components/TitleBarButtons"
import About from "./pages/About"
import QABot from "./pages/QABot/QABot"

const Settings = (props:any)=>{
  const navigate = useNavigate()
  const location = useLocation()

  let mobileTitle = location.pathname
  const subpaths = mobileTitle.split('/')
  
  if (subpaths.length == 2){
    mobileTitle = "Settings"
  }else{
    mobileTitle = subpaths[2]
  }
  const {backPath} =location.state
  return (
    <div className={styles.settingsPageContainer}>
      <div data-tauri-drag-region className={styles.titleBar}>
        {/* This is the titlebar for desktop screens */}
        <div onClick={()=> backPath?navigate(backPath):navigate("/")} className={styles.backButtonContainer + " " + styles.hidesm}>
          <BackArrow/>
        </div>
        <div className={styles.titleText  + " " + styles.hidesm}>Settings</div>


        {/* This is the titlebar for mobile screens */}
        <div onClick={()=> mobileTitle=="Settings"? backPath?navigate(backPath):navigate("/"): navigate("/settings",{state:{backPath}})} className={styles.backButtonContainer + " " + styles.hidegtsm}>
          <BackArrow/>
        </div>
        <div className={styles.titleText  + " " + styles.hidegtsm}>{mobileTitle.replace("%20", " ")}</div>
        <div className={styles.titleBarButtonsContainer}>
          <TitleBarButtons/>

        </div>
      </div>

      <div className={`${mobileTitle!="Settings"?styles.navbarActive:""} ${styles.responsiveSettingsGrid}`}>
        <div className={styles.navbar}>
          <div style={location.pathname.endsWith("Themes")? {fontWeight:"bold"}:{}} onClick={()=>navigate("Themes", {state:{backPath}})}>Themes</div>
          {/* <div onClick={()=>navigate("Reader Theme")}>Reader Theme</div> */}
          <div  style={location.pathname.endsWith("Fonts")? {fontWeight:"bold"}:{}} onClick={()=>navigate("Fonts", {state:{backPath}})}>Fonts</div>
          <div  style={location.pathname.endsWith("QABot")? {fontWeight:"bold"}:{}} onClick={()=>navigate("QABot", {state:{backPath}})}>QABot</div>
          <div  style={location.pathname.endsWith("About")? {fontWeight:"bold", marginTop:"auto"}:{marginTop:"auto"}} onClick={()=>navigate("About", {state:{backPath}})}>About</div>
        </div>

        <div className={styles.contentContainer}>
          <Routes>
            <Route path="/" element={<GlobalTheme />} />
            <Route path="/Themes" element={<GlobalTheme />} />
            {/* <Route path="/Reader Theme" element={<ReaderTheme />} /> */}
            <Route path="/Fonts" element={<Fonts />} />
            <Route path="/QABot" element={<QABot />} />
            <Route path="/About" element={<About />} />
          </Routes>
        </div>
      </div>

    </div>

  )
}


export default Settings