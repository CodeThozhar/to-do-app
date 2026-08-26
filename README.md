# Nexora — Personal Productivity Workspace

> **Plan. Build. Finish.**

A responsive productivity workspace built with HTML, CSS, and vanilla JavaScript, featuring task CRUD operations, search and filtering, live task statistics, Local Storage persistence, and a modern responsive SaaS-style interface.

## 🚀 Features

- **Task Management**: Create, edit, complete, and delete tasks instantly.
- **Smart Search & Filters**: Real-time partial matching search combined with Active/Completed contextual filters.
- **Live Statistics**: Dynamic counters track your total, completed, and remaining workloads across your entire task collection.
- **Persistent Storage**: All tasks and preferences are securely saved in your browser's Local Storage.
- **Dark Mode**: Beautiful, professionally designed slate dark theme with seamless transitions and FOUC prevention.
- **Responsive Design**: Carefully crafted fluid layouts ensure an excellent user experience on mobile, tablet, and desktop.
- **Intelligent Empty States**: Context-aware empty states guide you when searching or filtering yields no results.

## 🛠️ Technologies Used

- **HTML5**: Semantic document structure and inline SVG icons.
- **CSS3**: Custom properties (variables), Grid/Flexbox layouts, and responsive media queries.
- **Vanilla JavaScript (ES6)**: State management, DOM manipulation, event delegation, and persistence.
- **Local Storage API**: Zero-database client-side persistence.

## 📚 Learning Outcomes

Building Nexora V1 demonstrates mastery in:
- Advanced DOM manipulation and dynamic element rendering.
- Robust Event handling using Event Delegation pipelines.
- Data consistency flows mapping JavaScript Arrays to UI views.
- CRUD operations handled entirely on the client side without refreshing.
- Cross-session persistence and error handling using `localStorage`.
- CSS custom variables to manage complex theme switching dynamically.

## 🔮 Future Roadmap (V2+)

While V1 provides a robust, polished core experience, future updates may introduce:
- **Projects & Routines**: Hierarchical organization of tasks.
- **User Authentication**: Secure cloud syncing.
- **Team Workspaces**: Collaboration and task sharing.
- **Backend API Integration**: Transitioning from Local Storage to a persistent database.

## 🚀 Deployment

Nexora is a purely static front-end application with absolutely no build steps required. It can be instantly deployed to any static host:

### Vercel Deployment

1. Create a free account on [Vercel](https://vercel.com/).
2. Install the Vercel CLI or link your GitHub repository containing the files.
3. If using the CLI, simply navigate to the project directory in your terminal and run `vercel`.
4. Accept the default configuration prompts.
5. Your Nexora workspace will be live instantly!

### Netlify Deployment

1. Go to [Netlify Drop](https://app.netlify.com/drop).
2. Drag and drop the `nexora` project folder directly into the browser window.
3. Netlify will instantly generate a live, shareable URL for your application.
