import { AppAction } from "../actions/appAction"
import { useGlobalContextDispatch } from "../context/GlolbalContext"




export const useRolUsers = () => {
  const dispatch = useGlobalContextDispatch()
  const showSidebarValue = (value: boolean) => {
    dispatch({ type: AppAction.SHOW_SIDEBAR, payload: !value })
  }

  const toggleSidebarCollapsed = (value: boolean) => {
    dispatch({ type: AppAction.TOGGLE_SIDEBAR_COLLAPSED, payload: !value })
  }

  return {
    showSidebarValue,
    toggleSidebarCollapsed
  }
}
