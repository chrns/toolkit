#!/bin/bash

rm -rf node_modules dist .vite .cache package-lock.json && npm install && npm run dev -- --host 0.0.0.0