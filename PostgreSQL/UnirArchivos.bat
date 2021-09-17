@echo off
del 00-ACT_TAB.sql
for /f %%i in ('dir /b /s *.sql') do (type %%i >> 00-ACT_TAB.sql&echo. >> 00-ACT_TAB.sql )