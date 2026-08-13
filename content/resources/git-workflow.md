## Overview

This guide documents the Git and GitHub workflow used to maintain this engineering portfolio.

The goal is to keep project changes organized, traceable, and safe when working across multiple computers.


## Basic Workflow

Before starting work:

```bash

git status
git pull --ff-only origin main
```
After making and testing changes

```bash

git status
git diff
git add .
git commit -m "describe the change"
git push origin main
```

## Core Rules

- Pull before starting. 
- Commit and push before switching computers.

