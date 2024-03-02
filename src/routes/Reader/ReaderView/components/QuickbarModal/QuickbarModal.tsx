import React, { useEffect, useState } from 'react'; // we need this to make JSX compile


import {
  AddHighlight, 
  SkipMouseEvent,
  
} from '@store/slices/bookState'

// Transferred Imports
import styles from './QuickbarModal.module.scss'
import Copy from '@resources/iconmonstr/iconmonstr-copy-9.svg'
import Book from '@resources/iconmonstr/iconmonstr-book-26.svg'
import ChatGPT from '@resources/iconmonstr/iconmonstr-speech-bubble-comment-thin.svg'
import Search from '@resources/iconmonstr/iconmonstr-magnifier-2.svg'

import { useAppSelector, useAppDispatch } from '@store/hooks';
import { CalculateBoxPosition, NOTE_MODAL_HEIGHT, NOTE_MODAL_WIDTH, QUICKBAR_MODAL_HEIGHT, QUICKBAR_MODAL_WIDTH } from '../../functions/ModalUtility';
import { Rendition } from '@btpf/epubjs';
import toast from 'react-hot-toast';
import { writeText } from '@tauri-apps/api/clipboard';
import { MoveNoteModal, MoveQuickbarModal, SelectSidebarMenu, SetDictionaryWord, SetLLMInput, SetModalCFI, ShowNoteModal } from '@store/slices/appState';
import { invoke } from '@tauri-apps/api';
import { useParams } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';

const COLORS = ['#FFD600', 'red', 'orange','#00FF29', 'cyan']


const QuickbarModal = (props) =>{
  const params = useParams();

  const selectedRendition = useAppSelector((state) => state.appState.state.selectedRendition)
  const quickbarModalVisible = useAppSelector((state) => state?.appState?.state?.modals.quickbarModal.visible)
  const modalX = useAppSelector((state) => state?.appState?.state?.modals.quickbarModal.x)
  const modalY = useAppSelector((state) => state?.appState?.state?.modals.quickbarModal.y)
  const selectedCFI = useAppSelector((state) => state?.appState?.state?.modals.selectedCFI)
  const renditionInstance:Rendition = useAppSelector((state) => state.bookState[selectedRendition]?.instance)
  const qaBotId = useAppSelector((state) => state.appState.qaBotId)
  const {isQABotLoading, isQAEnabledForBook} = props;
  console.log("isQABotLoading", isQABotLoading);

  const dispatch = useAppDispatch()
  if(quickbarModalVisible){
    const result:any = renditionInstance?.getRange(selectedCFI)?.cloneContents().textContent
    if(!result){
      // This code was explicitely written to handle a crash related to the dual reader
      // the selectedCFI Seems to update before the selectedRendition & renditionInstance does
      // Because of this, in the event that the getRange returns null, We assume
      // that is because it is trying to get the selectedCFI Range of the wrong rendition
      
      console.log("Quickbar Crash prevented")
      return (<></>)
    }
    const showDict = !result.includes(" ");
    const isChatGPTDisabled = qaBotId.length === 0 || !isQAEnabledForBook;
    return(
      <>
        <div className={styles.container} style={{top:modalY, left: modalX, width: QUICKBAR_MODAL_WIDTH, height: QUICKBAR_MODAL_HEIGHT}}>
          <div className={styles.actionContainer}>
            <div onClick={async ()=>{
              renditionInstance.annotations.remove(selectedCFI, "highlight")
              dispatch(MoveQuickbarModal({
                x:0,
                y:0,
                visible: false
              }))
              await writeText(result);
              toast.success('Text Copied',
                {
                  icon: '📋',
                })
                          
            }}><Copy/></div>
            <div style={!showDict?{display:"none"}:{}}><Book onClick={()=>{
              console.log("About to set word", result)
              dispatch(SetDictionaryWord(result))
              renditionInstance.annotations.remove(selectedCFI, "highlight")
              dispatch(MoveQuickbarModal({
                view: 0,
                x:0,
                y:0,
                visible: false
              }))

            }}/></div>
            <Tooltip id="my-tooltip" className={styles.customTooltip}/>
            <div>
              { qaBotId.length > 0 ? ( (isQABotLoading || isQAEnabledForBook) ? 
                  (<ChatGPT 
                      onClick={()=>{
                        if (isQABotLoading) {
                          toast.loading("QABot is loading. Please wait a few seconds. :)")
                          return;
                        }
                        console.log("About to call Chat GPT with", result)
                        dispatch(SetLLMInput(result))
                        renditionInstance.annotations.remove(selectedCFI, "highlight")
                        dispatch(MoveQuickbarModal({
                          view: 0,
                          x:0,
                          y:0,
                          visible: false
                        }))}}
                  />)
                    :
                    (<ChatGPT 
                      data-tooltip-id="my-tooltip"
                      data-tooltip-content="QA Bot unavailable for this book :("
                      data-tooltip-place="right-start"
                      />
                    )
                  )
                
                : (<ChatGPT
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content="QA Bot is not enabled"
                  data-tooltip-place="top"
                  />
                  )
              }
            </div>
            <div onClick={()=>{
              dispatch(SelectSidebarMenu("Search#" + result))
              renditionInstance.annotations.remove(selectedCFI, "highlight")
              dispatch(MoveQuickbarModal({
                view: 0,
                x:0,
                y:0,
                visible: false
              }))
            }}><Search/></div>
          </div>
          <hr className={styles.divider}/>
          <div className={styles.highlightContainer}>
            {COLORS.map((item)=>{

              return <div key={item} style={{backgroundColor:item}} className={styles.highlightBubble} onClick={()=>{
                renditionInstance.annotations.remove(selectedCFI, "highlight")

                const cfiRangeClosure = selectedCFI
                console.log("ANNOTATION MADE", cfiRangeClosure)
                renditionInstance.annotations.highlight(selectedCFI,{}, (e:MouseEvent) => {
                  console.log("ANNOTATION CLICKED", cfiRangeClosure)

                  // This will prevent page turning when clicking on highlight
                  dispatch(SkipMouseEvent(0))
        

                  const {x, y} = CalculateBoxPosition(renditionInstance, cfiRangeClosure, NOTE_MODAL_WIDTH, NOTE_MODAL_HEIGHT)

                  dispatch(SetModalCFI(cfiRangeClosure))
                  dispatch(MoveNoteModal({
                    x,
                    y,
                    visible: true
                  }))

                  
                }, '', {fill:item});


                dispatch(MoveQuickbarModal({
                  x:0,
                  y:0,
                  visible: false
                }))

                dispatch(ShowNoteModal())
                
                dispatch(AddHighlight({highlightRange:selectedCFI, color:item, note:"", view:selectedRendition}))
              }}/>


            })}

          </div>
        </div>
      </>

    )
  }
  return null
} 


export default QuickbarModal

