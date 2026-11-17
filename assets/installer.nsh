; CrossOver 4 installer guard (electron-builder includes <buildResources>/installer.nsh).
;
; CrossOver 4 is Electron 40, x64 only: it needs 64-bit Windows 10 or later,
; and on ARM it needs Windows 11 (Windows 10 on ARM can't emulate x64).
;
; Why the installer checks this itself: v3 installs read the same latest.yml.
; v3.4.x (electron-updater 6.3.0) honors minimumSystemVersion, but v3.3.x and
; older ignore it, and no version can tell 32-bit Windows 10 apart by OS
; version. Without this guard:
;   - Windows 7/8/8.1: electron-builder only stops pre-Windows 7, so the
;     installer would remove v3 and install a v4 that can't start.
;   - 32-bit Windows: electron-builder shows "64-bit Windows required" on
;     every quit of v3, forever.
;
; preInit runs first in .onInit, before anything is uninstalled or written.
; On an unsupported system it quits and v3 stays exactly as it was. Silent
; runs (electron-updater's install on quit) quit without a dialog.

!include WinVer.nsh
!include x64.nsh

!macro preInit
  StrCpy $R9 ""
  ${IfNot} ${AtLeastWin10}
    StrCpy $R9 "CrossOver 4 needs Windows 10 or later. You can keep using CrossOver 3."
  ${ElseIf} ${IsNativeARM64}
    ${IfNot} ${AtLeastBuild} 22000
      StrCpy $R9 "CrossOver 4 needs Windows 11 on ARM. You can keep using CrossOver 3."
    ${EndIf}
  ${ElseIfNot} ${RunningX64}
    StrCpy $R9 "CrossOver 4 needs 64-bit Windows. You can keep using CrossOver 3."
  ${EndIf}

  ${If} $R9 != ""
    ${IfNot} ${Silent}
      MessageBox MB_OK|MB_ICONINFORMATION "$R9"
    ${EndIf}
    SetErrorLevel 2
    Quit
  ${EndIf}
!macroend
