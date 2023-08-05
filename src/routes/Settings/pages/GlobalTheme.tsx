import React, { useEffect, useRef, useState } from "react"
import { HexColorInput, HexColorPicker } from "react-colorful";

import styles from './ReaderTheme.module.scss'

import UndoButton from '@resources/iconmonstr/iconmonstr-undo-7.svg'
import TrashIcon from '@resources/feathericons/trash-2.svg'
import { useAppSelector } from "@store/hooks";
import {  AddTheme, DeleteTheme, RenameTheme, setSelectedTheme, UpdateTheme } from "@store/slices/appState";
import { useDispatch } from "react-redux";
import { invoke } from "@tauri-apps/api";

import { ThemeType, uiTheme } from "@store/slices/AppState/globalThemes";
import { GetAllKeys } from "@store/utlity";
import TitleBarButtons from "@shared/components/TitleBarButtons";


import ExitIcon from '@resources/figma/Exit.svg'
import MaximizeIcon from '@resources/figma/Maximize.svg'
import MinimizeIcon from '@resources/figma/Minimize.svg'
import Bookmark from '@resources/feathericons/bookmark.svg'
import List from '@resources/feathericons/list.svg'
import Search from '@resources/feathericons/search.svg'
import Font from '@resources/iconmonstr/text-3.svg'
import ArrowLeft from '@resources/feathericons/arrow-left.svg'
import ArrowRight from '@resources/feathericons/arrow-right.svg'
import HomeIcon from '@resources/feathericons/home.svg'
import PreviewWidget from "./PreviewWidget/PreviewWidget";


// import styles from './Settings.module.scss'

// import BackArrow from '@resources/feathericons/arrow-left.svg'
// import { Link } from "react-router-dom"
const uiOptions = [
  {path:["ui","primaryBackground"], label: "Primary Background"},
  {path:["ui","secondaryBackground"], label: "Secondary Background"},
  {path:["ui","primaryText"], label: "Primary Text"},
  {path:["ui","secondaryText"], label: "Secondary Text"}
]

const readerOptions = [
  {path:["reader","body", "color"], label: "Color"},
  {path:["reader","body", "background"], label: "Background Color"},
  // {path:["reader","primaryText"], label: "Primary Text"},
  // {path:["reader","secondaryText"], label: "Secondary Text"}
]

const GlobalTheme = ()=>{
  // const sidebarOpen = useAppSelector((state) => state.bookState[0]?.state?.sidebarMenuSelected)
  // const renditionInstance = useAppSelector((state) => state.bookState[0]?.instance)
  // const dispatch = useAppDispatch()
  
  
  const [selectedTheme, changeTheme] = useState("Default Light")

  const [color, setIntialColor] = useState("#000000");
  const [pickerPosition, setPosition] = useState({x:-500, y:-500})

  const appThemes = useAppSelector((state) => state.appState.themes)
  const defaultSelectedTheme = useAppSelector((state) => state.appState.selectedTheme)

  // This will keep track of the current state of the theme
  const prevAppThemes = useRef({appThemes}).current;


  // Error Catching
  const [displayError, toggleError] = useState(false)
  const [lastValidTheme, setLastValidTheme] = useState("Default Light")

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [colorUpdater, setColorUpdater] = useState(() => () => console.log("default ooops"))


  const dispatch = useDispatch()

  useEffect(()=>{
    changeTheme(defaultSelectedTheme)
    setLastValidTheme(defaultSelectedTheme)
  },[])

  // This is all to switch to the new theme
  // Clarity: This function should make it so the selected theme changes to the new theme upon creation
  useEffect(() => {
    const newThemesKeys = Object.keys(appThemes)
    const prevThemesKeys = Object.keys(prevAppThemes.appThemes)
    if(newThemesKeys.length > prevThemesKeys.length){
      const filteredArr = newThemesKeys.filter(x => !prevThemesKeys.includes(x));
      changeTheme(filteredArr[0])
      setLastValidTheme(filteredArr[0])
      dispatch(setSelectedTheme(filteredArr[0]))
      return () =>{
        prevAppThemes.appThemes = appThemes
      }
    }
  }, [appThemes])

  const readerColor = (readerOptions[0].path as GetAllKeys<ThemeType>[]).reduce((themeObjLevel:any, pathNavigate) => themeObjLevel[pathNavigate], appThemes[lastValidTheme])
  const readerBackgroundColor = (readerOptions[1].path as GetAllKeys<ThemeType>[]).reduce((themeObjLevel:any, pathNavigate) => themeObjLevel[pathNavigate], appThemes[lastValidTheme])

  return (
    <div className={styles.themeContainer} onClick={()=>{
      if(pickerPosition.x != -500){
        setPosition({x:-500, y:-500})
      }
    }}>

      <div style={{zIndex: 100, position:"absolute", left:pickerPosition.x, top:pickerPosition.y}}>
        <HexColorPicker onClick={(e)=>{
        // If the color picker is clicked, prevent the event from being propagated up to the themeContainer and the position being set offscreen
          e.stopPropagation()
        }}  color={color} onChange={(color)=>{

          // @ts-expect-error: This is some typescript + React wierdness. I don't think I can fix this.
          colorUpdater(color)
        }} />
        {/* {color}
        <HexColorInput color={color} style={{backgroundColor: "white", borderRadius: 5, zIndex:10}} onClick={(e)=>{
        // If the color picker is clicked, prevent the event from being propagated up to the themeContainer and the position being set offscreen
          e.stopPropagation()
        }}  onChange={(color)=>{

          // @ts-expect-error: This is some typescript + React wierdness. I don't think I can fix this.
          colorUpdater(color)
        }} /> */}
      </div>

      <PreviewWidget readerOptions={readerOptions}/>






      <div className={styles.comboContainer}>
        <div className={styles.comboContainerText}>Selected Theme</div>
        <select value={selectedTheme} onChange={(e)=>{
          changeTheme(e.target.value)
          setLastValidTheme(e.target.value)
          dispatch(setSelectedTheme(e.target.value))
        }} className={styles.comboBox}>
          {Object.keys(appThemes).map((themeName, index)=>{
            return <option key={index} value={themeName}>{themeName}</option>
          })}
          
        </select>
        <div onClick={()=>{
          dispatch(AddTheme())
          
        }} className={styles.newCombo}>New</div>
      </div>

      <div className={styles.comboContainer}>
        <div className={styles.comboContainerText}>Theme Name</div>
        <input disabled={lastValidTheme =="Default Light" || lastValidTheme == "Default Dark"} onChange={(e)=>{
          console.log(e.target.value,e.target.value.length, selectedTheme)
          console.log(appThemes)
          // TODO: FIX 0 length erorr
          if((appThemes[e.target.value] == undefined && e.target.value != selectedTheme) && e.target.value.length != 0){
            console.log("Name does not exist", e.target.value.length)
            toggleError(false)
            dispatch(RenameTheme({
              oldThemeName: lastValidTheme, newThemeName: e.target.value
            }))
            dispatch(setSelectedTheme(e.target.value))
            setLastValidTheme(e.target.value)
          }else{
            toggleError(true)
          }
          changeTheme(e.target.value)
          
          
  
          

          
        }} value={selectedTheme} style={{display:"block"}} className={styles.comboTextBox}/>
        <div style={{color:"red", display:(displayError?"block":"none")}}>Theme name already in use !</div>
      </div>

      <div className={styles.themePropertyContainer}>
        
        <div className={styles.themeTargetContainer}>
          <div className={styles.themeTarget}>
            Global Theme Settings
          </div>


          {uiOptions.map((item)=>{
            const currentThemeColor = (item.path as GetAllKeys<ThemeType>[]).reduce((themeObjLevel:any, pathNavigate) => themeObjLevel[pathNavigate], appThemes[lastValidTheme])
            return (
              <div key={item.path.reduce((a, c) => a + c)} className={styles.themePropertyRow}>
                <div className={styles.themePropertyName}>
                  {item.label}
                </div>
                <button disabled={lastValidTheme =="Default Light" || lastValidTheme == "Default Dark"} onClick={(e)=>{
                  type GuaranteeKeySafety = keyof uiTheme

                  const bounds = e.currentTarget.getBoundingClientRect()
                  setPosition({x:bounds.x - 100, y:bounds.y - (200 + 20)})
                  setColorUpdater(()=>(color:string) => {
                    console.log(lastValidTheme, color, item.path)
                    dispatch(UpdateTheme({
                      themeName: lastValidTheme,
                      newColor: color,
                      path: item.path
                    })
                    )})
                  const newInitialColor = currentThemeColor
                  if(newInitialColor !== undefined){
                    setIntialColor(newInitialColor)
                  }
                }} style={{backgroundColor:currentThemeColor}} className={styles.themeColor}/>
                <UndoButton onClick={()=>{
                  if(lastValidTheme =="Default Light" || lastValidTheme == "Default Dark"){
                    return 
                  }

                  const defaultValue = (item.path as GetAllKeys<ThemeType>[]).reduce((themeObjLevel:any, pathNavigate) => themeObjLevel[pathNavigate], appThemes["Default Light"])
                  dispatch(UpdateTheme({
                    themeName: lastValidTheme,
                    newColor: defaultValue,
                    path: item.path
                  }))
                }} className={styles.resetButton}/>
              </div>
            )
          })}
          

          

          
        </div>




        <div className={styles.themeTargetContainer}>
          <div className={styles.themeTarget}>
            Reader Theme Settings
          </div>


          {readerOptions.map((item)=>{
            const currentThemeColor = (item.path as GetAllKeys<ThemeType>[]).reduce((themeObjLevel:any, pathNavigate) => themeObjLevel[pathNavigate], appThemes[lastValidTheme])
            return (
              <div key={item.path.reduce((a, c) => a + c)} className={styles.themePropertyRow}>
                <div className={styles.themePropertyName}>
                  {item.label}
                </div>
                <button disabled={lastValidTheme =="Default Light" || lastValidTheme == "Default Dark"} onClick={(e)=>{
                  type GuaranteeKeySafety = keyof uiTheme

                  const bounds = e.currentTarget.getBoundingClientRect()
                  setPosition({x:bounds.x - 100, y:bounds.y - (200 + 20)})
                  setColorUpdater(()=>(color:string) => {
                    console.log(lastValidTheme, color, item.path)
                    dispatch(UpdateTheme({
                      themeName: lastValidTheme,
                      newColor: color,
                      path: item.path
                    })
                    )})
                  const newInitialColor = currentThemeColor
                  if(newInitialColor !== undefined){
                    setIntialColor(newInitialColor)
                  }
                }} style={{backgroundColor:currentThemeColor}} className={styles.themeColor}/>
                <UndoButton onClick={()=>{
                  if(lastValidTheme =="Default Light" || lastValidTheme == "Default Dark"){
                    return 
                  }

                  const defaultValue = (item.path as GetAllKeys<ThemeType>[]).reduce((themeObjLevel:any, pathNavigate) => themeObjLevel[pathNavigate], appThemes["Default Light"])
                  dispatch(UpdateTheme({
                    themeName: lastValidTheme,
                    newColor: defaultValue,
                    path: item.path
                  }))
                }} className={styles.resetButton}/>
              </div>
            )
          })}
          

          

          
        </div>
      </div>


      <div onClick={()=>{
        console.log("Delete button pressed")
        // console.log(Object.keys(appThemes).filter((key) => key != selectedTheme)[0])
        changeTheme("Default Light")
        setLastValidTheme("Default Light")
        
        dispatch(DeleteTheme(selectedTheme))
        dispatch(setSelectedTheme("Default Light"))
        // changeTheme(Object.keys(appThemes).filter((key) => key == selectedTheme)[0])

      }} style={{display: lastValidTheme == "Default Light" || lastValidTheme == "Default Dark"?"none":""}} className={styles.deleteButton}><TrashIcon style={{transform:"scale(1.2)", marginRight:10}}/> Delete Theme</div>
      
    </div>

  )
}


export default GlobalTheme