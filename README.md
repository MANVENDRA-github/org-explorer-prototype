# Org Explorer

### Local-First Organizational Intelligence for GitHub Ecosystems

---

## Overview

Org Explorer is a frontend-only, local-first web application that transforms GitHub organizational data into actionable insights.

Instead of functioning as a traditional dashboard, Org Explorer introduces an intelligence layer over GitHub data that helps understand how organizations operate at scale.

It enables users to:

* Analyze multiple GitHub organizations as a single system
* Explore contributor–repository relationships
* Identify risks, trends, and inefficiencies
* Generate meaningful insights without relying on cloud infrastructure

---

## Objectives

* Move beyond raw metrics to insight generation
* Support multi-organization aggregation
* Operate fully in-browser without backend dependencies
* Ensure privacy-first and offline-first design
* Handle large-scale open-source ecosystems efficiently

---

## Core Features

### Multi-Organization Aggregation

* Accept multiple GitHub organizations as input
* Merge them into a unified dataset
* Deduplicate contributors across organizations

---

### Interactive Contribution Graph

Visualizes relationships between repositories and contributors.

#### Graph Encoding

| Element        | Meaning                                 |
| -------------- | --------------------------------------- |
| Node Size      | Activity or importance                  |
| Node Color     | Entity type (repository or contributor) |
| Edge Thickness | Contribution volume                     |
| Node Position  | Activity-based clustering               |

#### Interactions

* Hover to view summary details
* Click to open detailed insights panel
* Filter by activity, time range, and repository size

---

### Insight Engine

Generates analytical insights such as:

* Repositories with low recent activity
* Contributor concentration (bus factor risk)
* Declining activity trends
* Issue backlog imbalance

Each insight includes:

* explanation
* reasoning
* linked entities

---

### Time-Series Analytics

Tracks activity trends over time:

* Pull requests opened, merged, closed
* Issues opened and closed
* Contributor activity

Supports weekly and monthly aggregation.

---

### Data Tables

Provides structured views for repositories and contributors:

* Sorting, filtering, and search
* Efficient handling of large datasets

---

### Export System

Supports exporting data and insights as:

* CSV
* PDF reports with summaries and analytics

---

## System Architecture

Org Explorer follows a layered and modular architecture:

```
GitHub API Layer
        ↓
Caching Layer (IndexedDB + localStorage)
        ↓
Data Normalization Layer
        ↓
Analytics & Insight Engine
        ↓
Presentation Layer (UI)
```

### Key Principles

* IndexedDB serves as the single source of truth
* Analytical logic is separated from UI
* UI consumes processed data, not raw API responses
* No backend dependency

---

## Data Flow

1. Fetch data from GitHub APIs
2. Cache data locally
3. Normalize and merge entities
4. Compute analytics and aggregates
5. Generate insights
6. Render UI

---

## Project Structure

```
src/
  app/                  # routes / pages
  components/           # UI components
  services/             # API and sync orchestration
  lib/
    github/             # API clients
    idb/                # IndexedDB layer
    analytics/          # computation logic
    merge/              # multi-organization merging
    export/             # CSV and PDF generation
  hooks/                # custom hooks
  state/                # state management
  types/                # TypeScript interfaces
  styles/               # theme and global styles
```

---

## Core Modules

### Services Layer

Handles GitHub API requests, rate limiting, and incremental synchronization.

### Caching Layer

* IndexedDB for structured data storage
* localStorage for metadata and preferences

### Analytics Engine

Responsible for:

* aggregations
* trend analysis
* insight generation

### Graph Engine

Builds:

* nodes representing repositories and contributors
* edges representing relationships
* layout hints for visualization

### UI Layer

Includes:

* graph visualization
* analytics dashboards
* tables and export interfaces

---

## Data Model (Overview)

Core entities include:

* Repository
* Contributor
* Contribution Edge
* Time-Series Data
* Insight

---

## Tech Stack

| Technology            | Purpose                        |
| --------------------- | ------------------------------ |
| React + TypeScript    | UI development and type safety |
| Vite                  | Build tool                     |
| Sigma.js              | Graph visualization            |
| ECharts               | Analytics visualization        |
| TanStack Table        | Data tables                    |
| IndexedDB (Dexie/idb) | Local storage                  |
| Zustand               | State management               |

---

## Performance Considerations

* IndexedDB caching to reduce API usage
* Incremental data fetching
* Virtualized tables for large datasets
* Graph node limiting for scalability
* Optional Web Workers for heavy computations

---

## Error Handling

The system handles:

* GitHub API rate limits
* Network failures
* Invalid organization inputs
* Partial datasets

Graceful degradation includes:

* fallback to cached data
* sync status indicators
* user feedback for incomplete data

---

## Future Enhancements

* Plugin-based insight system
* Multi-platform support (e.g., GitLab)
* Organizational health scoring
* Advanced graph clustering

---

## Current Status

* Using mock data for demo purposes

---
