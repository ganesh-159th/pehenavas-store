@echo off

if not exist .env if exist .env.example (
    echo Creating .env file from .env.example...
    copy .env.example .env
)

echo Installing dependencies for pehenavas-store...
call npm install

echo Starting the project...
call npm run dev