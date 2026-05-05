@echo off
chcp 65001 >nul
echo ========================================
echo   Menu Issue Diagnosis and Fix Tool
echo ========================================
echo.

:menu
echo Please select an option:
echo.
echo 1. Run diagnosis script (check issues)
echo 2. Run fix script (auto fix)
echo 3. Run test script (verify results)
echo 4. Open documentation
echo 5. Exit
echo.
set /p choice=Enter option (1-5): 

if "%choice%"=="1" goto diagnose
if "%choice%"=="2" goto fix
if "%choice%"=="3" goto test
if "%choice%"=="4" goto docs
if "%choice%"=="5" goto end
echo Invalid option, please try again
goto menu

:diagnose
echo.
echo ========================================
echo   Running diagnosis script...
echo ========================================
echo.
node scripts/diagnose-menu-issue.js
echo.
pause
goto menu

:fix
echo.
echo ========================================
echo   Running fix script...
echo ========================================
echo.
node scripts/fix-role-menus.js
echo.
pause
goto menu

:test
echo.
echo ========================================
echo   Running test script...
echo ========================================
echo.
node scripts/test-new-user-menu.js
echo.
pause
goto menu

:docs
echo.
echo ========================================
echo   Opening documentation...
echo ========================================
echo.
start docs/DIAGNOSIS_AND_FIX.md
goto menu

:end
echo.
echo Thank you for using!
pause
