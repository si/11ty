---
title: "Visualise habits with a Personal Dashboard"
date: 2021-12-06
categories: 
  - "blog"
tags: 
  - "data-visualisation"
  - "ifttt"
  - "personal-improvement"
  - "strava"
  - "trello"
  - "zapier"
coverImage: "Personal-Dashboard-Trello-Strava-Goodreads-ArchiveCollection-Tweets.png"
---

**Over recent months, I've been slowly working on a little side project to monitor and observe personal habits, ideally to identify improvements. I've called this my Personal Dashboard.**

## Let's set the context…

For those who work in tech, dashboards are quite a common concept for highlighting key metrics and trends with charts so we can make informed decisions. As a data junkie and visual person (or an "_informatician_" as [Brian](http://suda.co.uk) likes to say), I've often enjoyed scrutinising the data, understanding what's happening, having conversations around engaging information.

When I started to analyse my own productivity, health and financial habits, it dawned on me I could create a "personal dashboard" to automatically capture data and visualise in a single central view. I've been manually recording some of this data over the years (such as pension balances across multiple policies and fuel spend); tools like [Ticktick](https://ticktick.com/zFVY6?u=d329b4da060741dbadd960e21150f1f2) and [Trello](https://trello.com/sijobling/recommend) provide simple functionality to track productivity and [Strava](http://strava.com) & [MyFitnessPal](http://myfitnesspal.com) have provided years of tracking my fitness and weight.

It was through browsing the [IFTTT apps](https://ifttt.com/explore) I realised it would be quite easy to configure some recipes to sync many of these apps with a [Google Sheet](https://docs.google.com/spreadsheets/) so I could analyse the data my own way.

## Automating the data

If you've not used IFTTT before, it's a great tool to hook up _Internet of Thing_ (IoT) devices with online services. The premise is to link triggers with events – if this, then that – and there are endless possibilities as their catalogue of services continue to grow. (I've actually upgraded my account to the [IFTTT Pro subscription](https://ifttt.com/plans) since they launched as it provides premium services and more versatility over the events).

At the time of writing, IFTTT currently supports the following apps:

- [Trello](https://ifttt.com/trello) (when an item is moved to a column)
- [TickTick](https://ifttt.com/TickTick) (when an item is completed)
- [Monzo](https://ifttt.com/monzo) (when a transaction occurs)
- [Twitter](https://ifttt.com/twitter) (when a tweet is posted)

Where IFTTT fell short was on [Strava](https://www.strava.com/) activities and enhanced RSS parsing with custom data elements in feed descriptions such as [Goodreads](http://goodreads.com) activity with book specifics. Thankfully, [Zapier](http://zapier.com) was able to provide these services so respective "zaps" were configured for these habit trackers.

One of the limitations with [Google Sheets IFTTT](https://ifttt.com/google_sheets) events is that you can only append data to the _first sheet_ in a worksheet. As I want to visualise all the information in a single dashboard location, I had to get creative with multiple Google Sheet worksheets and the `=IMPORTRANGE()` function on dedicated sheets to pull in data from other worksheets. It's also worth noting Zapier actually allows you to specify the target sheet within a worksheet.

Whilst Zapier is more versatile with the event configurations, you are limited to 100 events per calendar month on their free plan which can be quickly used up on active feeds. [Paid plans](https://zapier.com/app/billing/plans) start at £15.26/month (at the time of writing) so you need to be heavily invested in this habit tracking solution to feel the value.

## Trello data with IFTTT

Time to demonstrate the configuration of an IFTTT recipe with a dedicated Google Sheet of completed Trello actions.

![](/img/assets/2021/11/Trello-to-Google-Sheet-IFTTT-recipe.png)

1. Create your [IFTTT](https://ifttt.com/home) account if you haven't already.
2. Select the Trello service from the **IF** trigger list and connect your account.
3. Choose the "_Card added to list_" event.
4. Specify the Trello workspace and board then type in the list name as it appears on your Trello board - mine is "_Completed_ 👍".
5. Now select the "Google Sheet" service from the **THEN** list and connect your Google account.
6. Choose the "Add row to spreadsheet" as **Event Option**.
7. Specify the **Name of your spreadsheet**, I called mine "Completed Trello items"
8. Set the formatted row with the following fields:  
      
    `{{AddedAt}} ||| {{Title}} ||| {{Description}} ||| {{ListName}} ||| {{BoardName}} ||| {{CreatorFullName}} ||| {{CreatorUsername}} ||| {{CardURL}}`  
      
    (The last four fields aren't really necessary but I like to capture those details anyway.)
9. Set the **Driver folder path** to `IFTTT/Trello/{{ListName}}`
10. Save your recipe and enable it.
11. Time to test the configuration now. Move one of the cards in your Trello board to the completed list and load up your Google Sheet to see if the data comes through correctly.

## Strava data with Zapier

This one might be more niche but let's go through the configuration of a Strava zap to demonstrate how that works with Google Sheets. You can [copy my Zap](https://zapier.com/shared/61c1ad0450d1729947675c5274145f07d0dc89f3) but it's better to build it yourself to understand what's happening.

![](/img/assets/2021/11/Strava-data-mapping-in-Zapier.png)

1. Create your free [Zapier](https://zapier.com) account if you haven't already
2. **Create a Zap** from the menu
3. Search for the "Strava" **Trigger** and set **Trigger Event** to "New activity".
4. Now you need to authenticate your Strava account with Zapier.
5. Once you've done that, fire off the **Test Trigger** to hopefully see a recent activity from your account
6. Now we'll set the **Trigger** to "Google Sheets" which can be found in the search field and set **Action Event** to "Create Spreadsheet Row".
7. Now connect your Google account with Zapier
8. Copy my [Strava Template Google Sheet](https://docs.google.com/spreadsheets/d/1j3Zc0rsFcVkpbQbsfv8ge3FuVk-4JN5QJumSbS4yE6w/edit?usp=sharing) to your own drive, maybe in a "Personal Dash" folder
9. Select your copy of the file as the **Spreadsheet** and set the **Worksheet** to "Strava Data"
10. Now we need to map the Strava data to our Worksheet columns:
     - **Activity Date** to `Start Date`
     - **Activity Type** to `Type`
     - **Activity Name** to `Name`
     - **Distance KM** to `Distance in K`
     - **Elapsed Time** to `Elapsed Time`
     - **Moving Time** to `Moving Time`
     - **Max Heart Rate** to `Max Heartrate`
     - **Average Heart Rate** to `Average Heartrate`
     - **Activity Description** to `Activity URL Generated`
11. Hit **Continue** to save your configuration.
12. Time to test it - hit the **Test & Review** button under the preview text and check your Google Sheet for a new row of data.
13. Remember to name your Zap to something like "Strava activity to Google Sheet" and hit **Turn On Zap**.

## Visualising in Google Sheets

Now, let's setup some PivotTables and charts to visualise your data. First up, we're going to get a split of workout types from our Strava data.

1. Highlight the first two columns "Activity Date" and "Activity Type" of your Strava data sheet (A:B) then from the menu, select **Insert > PivotTable**
2. On the "Create pivot table" modal, select **New sheet**
3. Google has a good stab at suggesting suitable data sets but we'll do this manually.
4. In the **Rows** section, add the "Activity Type" field
5. In the **Values** section, add "Activity Date"
6. Make sure it's Summarised by "COUNTA"
7. I also like to order by the largest count so, in the rows section, change the Order to "Descending" and Sort by "COUNTA of Activity Date". Deselect "Show totals" as well.
8. With the data now organised, let's create a pie chart. Select both columns (A:B) and from the menu, Insert > Chart.
9. On the **Chart Editor** menu, choose "Doughnut chart" from the **Chart type** dropdown
10. You can now tweak the appearance under the **Style** tab of the **Chart Editor**.
11. Set a suitable **Chart title** to "Workout type split"
12. Under the **Pie chart** section, set **Slice label** to Value, increase **Label font size** to 30, set **Text colour** to white and bold.

<figure>

![](/img/assets/2021/11/Strava-workout-split-doughnut-chart.png)

<figcaption>

Plenty running activities

</figcaption>

</figure>

Now let's break down our completed Trello data on a daily basis. First, we need to parse the completed date/time stamp from IFTTT to a readable data format. For this, we'll use some regular expressions with the `=DATEVALUE` function.

1. In your Trello "Completed items" sheet, create a new column at the end of your sheet.
2. On the second row (beneath your column headers), add the following formula where A2:A is your column of date and time: `=ArrayFormula(IF(ISBLANK(A2:A),,DATEVALUE(REGEXREPLACE(A2:A,"at",""))))`
3. This will get the date before "_at_" in the string and parse to a date value. The `ArrayFormula` will repeat the function on all following rows and `ISBLANK` will only parse it when text is available.
4. Now, select your new column of dates (column I for me), select **Insert > Pivot Table** from the menu and create a new sheet.
5. In the Pivot table editor, select your new "Date" column in the Rows section and set the Order to Descending.
6. In the Values section, add the "Date" column again and Summarise by "COUNTA".
7. You should now have a break down of completed items by date.
8. To remove any empty date rows, create a Filter with the Date column, change Status to "Filter by Condition > Is not empty" and hit OK.
9. You can also apply some date-based groupings to your date (such as monthly) by right-clicking the first column of your pivot table and select Create pivot date group > Year-month.
10. To show a counter chart of the latest daily count compared to the previous date, select the first row count (cell B2) and select Insert > Chart.
11. Choose Scorecard from the Chart Type dropdown and make sure COUNTA of Date is set to the Key Value.
12. To show a difference on the previous date, in the Baseline Value dropdown, select the grid on the right, highlight the first two rows of counts (B2:B3) and hit OK.

<figure>

![](/img/assets/2021/11/Daily-completed-Trello-scorecard.png)

<figcaption>

A bad day of Trello items

</figcaption>

</figure>

## What's next?

This is an ongoing side project which is constantly growing and refined based on new habits I want to track against life goals. I'd highly encourage you to experiment with these mechanisms to track your personal habits, whether they're in Trello and Strava or other online apps. You'd be surprised how easy it is to get that data out of the apps into your own (Google) hands for archives and analysis.

<figure>

![Personal Dashboard with Trello, Strava, Goodreads, #ArchiveCollection, Tweets](/img/assets/2021/11/Personal-Dashboard-Trello-Strava-Goodreads-ArchiveCollection-Tweets.png)

<figcaption>

Snapshot of the Dashboard

</figcaption>

</figure>

I'll follow up on this in the future with further improvements. I'd like to build a more dedicated app that uses the Google Sheets data in a user-friendly web UI, especially with a mobile friendly experience as the current Dashboard is only optimised for large screens and the ability to customise for personalised needs – a possible side project for 2022…
