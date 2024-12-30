# Time Tracker client

This app is the main UI of the time tracker.
You can build it with `yarn build` or save it with live update (for development) with `yarn dev`.

It is styled mostly with `material-ui`.

## Project structure
```
src/client
├── App
│   ├── App.js # contains all the routes of the app
│   ├── AppShell.js # contains the root shell of the app
│   ├── ErrorDisplay.js # snackbar the appears when an error returned from the server
│   ├── Header.js # app header
│   ├── index.js
│   └── styles.js # material-ui theme provider
├── Auth
│   ├── ChangePassword.js # change password page
│   └── LoginForm.js # login page
├── Reports
│   ├── AdvancedReport.js
│   ├── ClientsReport.js
│   └── UsersReport.js
│   └── ActivityReport.js
├── Settings
│   ├── Activities.js
│   ├── Client.js
│   ├── Clients.js
│   ├── User.js
│   └── Users.js
├── TimeTracking
│   └── TimeTracking.js
├── common
│   ├── ActivityIndicator.js # Spinner that is showen when data is loaded
│   ├── DayPicker.js # Picker that is used in Time Tracking
│   ├── EditableTable.js # Table that is used activities and time tracking
│   ├── ErrorMessage.js # inline error showen in auth pages
│   ├── MultipleSelection.js # multiple selection tool used in reports and setting pages
│   └── TextField.js # input box
├── core
│   ├── apiClient.js # axios client, base for all other api services
│   ├── authService.js # authentication logic
│   └── usersService.js # access to users api service
│   ├── clientsService.js # access to clients api service
│   ├── activitiesService.js # access to activites api service
│   ├── timetrackingService.js # access to timetracking api service
│   ├── reportsService.js # access to reports api service
│   ├── csvGenerator.js # logic for generating reports csv files
├── index.html # html template for the client app
└── index.js # main javascript entry point
```
