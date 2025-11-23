---
title: "Recently Played Episodes Data from Apple Podcasts"
date: 2021-10-04
categories: 
  - "blog"
tags: 
  - "apple-podcasts"
  - "code"
  - "database"
  - "macos"
  - "sqlite"
coverImage: "Recently-Played-Apple-Podcast-SQLite-.png"
---

I was recently curious how I could get my recently played podcasts out of Apple Podcasts for sharing with others so my ex-coding senses started tingling.

Googling around suggested there's no obvious solutions or API's available for accessing this information but then I fell across a [StackOverflow thread for migrating subscriptions OPML to Overcast](https://apple.stackexchange.com/questions/374696/exporting-podcasts-from-ios-app-as-opml) which highlighted the source of Apple Podcasts data – **SQLite** and some relatively straight forward table names. (This is naturally focused on MacOS for research and development purposes but I suspect some iOS experts could convert the logic there.)

I got to work in [DB Browser for SQLite](https://sqlitebrowser.org) – a free macOS app for, you've guessed it, browsing SQLite databases. As an ex-developer quite comfortable in SQL Server, Oracle and mySQL, the navigation tree and query structure all came flooding back quite quickly. The joins across a couple tables ended up returning the data I wanted:

- last-played date and time in Unix standard
- podcast name
- episode title
- podcast website URL
- podcast feed URL
- MP3 enclosure URL

Here's the SQL:

```
SELECT 
	datetime (ep.ZLASTDATEPLAYED + 978307200,
                "unixepoch",
                "utc") AS last_played,
	pod.ZTITLE AS podcast_title,
	ep.ZTITLE AS episode_title,
	coalesce(ep.ZWEBPAGEURL,pod.ZWEBPAGEURL) AS webpage_url,
	pod.ZFEEDURL,
	ep.ZENCLOSUREURL
FROM ZMTEPISODE AS ep
JOIN ZMTPODCAST AS pod ON pod.Z_PK = ep.ZPODCAST
WHERE last_played > '2021-09-01' AND last_played < '2021-10-01'
ORDER BY ep.ZLASTDATEPLAYED ASC
```

This query limits results to the last month (1st September to 1st October) so make sure those dates are modified to suit your needs.

It's also worth noting the magic number `978307200` for converting the `ZLASTDATEPLAYED` float to something that works – hat tip to [Andy Yates](http://andydev.co.uk) for solving that oddity for me.

This blog post is one for future reference and anyone else curious how to extract data from Apple Podcasts. The next step for me is converting this data to something usable beyond CSV, ideally HTML for syndicating in this blog and beyond.
