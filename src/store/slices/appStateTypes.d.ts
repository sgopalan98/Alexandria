import { ThemeType } from "./AppState/globalThemes";

  
export interface defaultAppState {
      themes: {[themeName:string]: ThemeType},
      selectedTheme: string,
      sortDirection: string,
      sortBy: string,
      readerMargins: number,
      // TODO: Should it be isQABotActive?
      qaBotId: string,
      qaBotApiKey: string,
      state:{
        localSystemFonts: {[fontName: string]: Array<string>},
        maximized: bool,
        selectedRendition: number,
        dualReaderMode: boolean,
        dualReaderReversed: boolean,
        dictionaryWord: string,
        // TODO: Should LLMInput be lowercase?
        LLMInput: string,
        sidebarMenuSelected: boolean|string,
        themeMenuActive: boolean,
        menuToggled: boolean,
        progressMenuActive:boolean,
        footnote:{
          active: boolean,
          text:string,
          link: string
        }
        modals:{
          selectedCFI: string,
          quickbarModal: {visible: boolean, x:number, y:number},
          noteModal: {visible: boolean, x:number, y:number}
        },
      }
    
    }