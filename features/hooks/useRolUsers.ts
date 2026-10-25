import { AppAction } from "../actions/appAction"
import { useGlobalContextDispatch } from "../context/GlolbalContext"




export const useRolUsers = () => {
  const dispatch = useGlobalContextDispatch()
  const showSidebarValue = (value: boolean) => {
    dispatch({ type: AppAction.SHOW_SIDEBAR, payload: !value })
  }

  const toggleSidebarCollapsed = (value: boolean) => {
    const nextCollapsed = !value;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('eva_sidebar_collapsed', String(nextCollapsed));
      }
    } catch (e) {
      console.warn("No se pudo guardar eva_sidebar_collapsed en localStorage", e);
    }
    dispatch({ type: AppAction.TOGGLE_SIDEBAR_COLLAPSED, payload: nextCollapsed })
  }

  return {
    showSidebarValue,
    toggleSidebarCollapsed
  }
}
