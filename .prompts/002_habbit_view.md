# First product

Todays Task is implement a main interface and Habit View!

## First look

On oppening "sheetlife.app" it should has a list of all files on the left.
Internal explorer, like in a vscode or other code editor. Design should be minimal.

it should be already opened a temporal *.xlsx file, indicating that now we are in it.

There should be a clear button like "Add a habit". 

## View Commom layout


Regardless of View, we wanna have a set of common actions:
-- file explorer
-- right click on any file in the explorer and click "download button"
-- sync status (make it not sync icon, later we will pick it up)

app/views/layout.tsx — layout for all “view pages”
app/views/[viewType]/[fileId]/page.tsx — a specific view for a specific file

So you get a hierarchy:
Global layout: header, login, very top-level things
Views layout: file explorer + sync status + “chrome” around all views
View page: the actual embedded view (Habits, whatever) rendered inside that shell

## Proposed Habit File Excel Structure

Habit View is just a nice view over a history of habits - xlsx file:

first page is a set of all habits:

```
habit-id	icon	name	description	created_at	category	period deprecated_at
make-bad	🧹🛏️	Make a bad	Make a bad right after waking up	08-Dec-25	Morning Habits	day
```

Second list is a history of all of them

```
datetime	habit-id	status	comment
08-Dec-25	make-bad	OK	
```

File should be stored in LocalStorage of a browser for now

## Habit View

By default Habit View should have a habit lists in the vertical bar and day of weeks at the horizontal vertial things.

You can click and mark habit as done at any moment. You may move habit order, remove it from the view, etc.

You probably will need some kinda "view" sheet in xlsx file to keep all info about how viewing it (like last opening view, hidden habits, colors, etc)

There should also be other "sub-views":
- a month per habit: a nice way to see you progress over a month for a specific habbit
- year per habit: github like "commit history", where you just see last 365 and you commitment in your habit. Probably should be option where you can select only subset of a habits here, or even one habit
