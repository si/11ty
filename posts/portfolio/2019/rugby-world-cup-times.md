---
title: "Rugby World Cup Times"
date: 2019-10-07
categories: 
  - "portfolio"
tags: 
  - "kickoff"
  - "open-source"
  - "rugby-world-cup"
  - "sports"
coverImage: "rugby-world-cup-times.png"
---

_The latest in a long line of sports based calendar apps I’ve got a habit of making, this time for [Rugby World Cup 2019](https://rugbyworldcuptimes.com/)._

## Kick Off

Way back in 2006, I applied some recently proposed web standards (Microformats) to the upcoming football World Cup which could be parsed out into calendar subscriptions for Outlook, MacOS and Google (there was very little mobile web back then!)

After some amazing coverage from the web community and media outlets (like BBC, The Guardian and Yahoo!), it was an extremely popular success and demonstrated the potential of sports based calendars.

When Euro 2008 came around, I applied the model again to limited success but it caught the attention of UEFA who commissioned a custom build for their competititions. Since then, I’ve worked with friends to create similar versions for [6 Nations rugby](https://6nations.kickofftimes.app/), [Formula 1 racing](https://f1calendar.com/) and a couple more world cups.

## Half Time

As I repeated the model, I started to explore alternative platforms for quickly building these calendars. The pattern was common but the underlying technology was getting messy as the initial “hack” was just getting disorganised and difficult to maintain with small iterations getting out of hand.

I started to [build a solution](https://kickofftimes.app) in [CakePHP](http://cakephp.org/) (my go-to framework at the time) which allowed anyone to create a calendar and share in open formats (ICS, JSON and RSS). It was a mobile first solution which introduced further UI challenges and, as a side project, never really got the full attention it deserved.

I used the platform to create a calendar for [World Cup 2016](https://kickofftimes.app/competitions/view/world-cup-2018) and manage [6 Nations calendars](https://6nations.kickofftimes.app) to mixed results.

However, the platform was tricky to support with limited knowledge and capacity to maintain so it eventually lost traction.

## Extra Time

During the Spring this year with the Rugby World Cup approaching, I had a revelation; rather than trying to centralise the sports calendars and revive a two year old app, why not start again with an open-source approach so anyone could create their own custom calendars?

**The foundations of this project came from adopting, extending and championing standard patterns with cutting-edge tech.** By creating an open-source framework for others to use and contribute towards, it will allow the creation of many other online calendars and encourage the community to extend and improve the framework.

I had a new-found energy to make this happen and even reached out to some old friends to support me. With the Rugby World Cup competition as my guinea pig and a fixed date to work towards, I had to prioritise what was needed to get the minimum viable product out the door. I was also keen to learn the latest technology after a bit of a hiatus from code with my job taking a leadership focus. This was an opportunity to learn some Node, frameworks and hosting options so I could understand the Web landscape after a few years focused on people and delivery processes.

Along the way, I realised I would benefit from a small community to encourage me to deliver. It prompted the formation of [On The Side](http://sijobling.com/blog/on-the-side/) – a small Slack community where others struggling to focus on side projects could support and help each other to get something out the door. (Read the blog post for more details)

## Final Whistle

After a month or so of development, supported by the [OTS community](https://ontheside.network/) and following constant iterative prioritisation, I managed to get a [Minimum](https://rugbyworldcuptimes.com/) _[Loveable](https://rugbyworldcuptimes.com/)_ [Product](https://rugbyworldcuptimes.com/) live a week ahead of the competition starting (_how about that_ – releasing something _before_ a deadline‽).

Development didn't end once it was live though. I continued to release minor updates from user feedback; accessibility concerns over text contrast, layout bugs on some devices I didn't have access to, filtering options by tags… you get the idea. User feedback trumped most my personal plans as they were validated requirements.

By utilising Github's architecture, the project is setup as a [dedicated open-source group](https://github.com/kickofftimes/), [issues tracked](https://github.com/kickofftimes/gatsby-template/issues) and [projects planned](https://github.com/kickofftimes/gatsby-template/projects) in the hope of others getting involved (hat-tip to [Kevin](https://github.com/kevinc-cogapp) for his [Gatsby](https://www.gatsbyjs.org/) skills). Using Github also allowed me to try out [Netlify](https://netlify.com) for continuous deployment on a free hobby hosting plan. It was amazingly seamless to configure and really encouraged me to focus on rapid releases which ensured only quality code was shipped through testing.

## Next Round

[Rugby World Cup Times](https://rugbyworldcuptimes.com/) was just the first edition of this project to see how it works. I'll now be reviewing the project, whether this open-source approach works, observing all the data I can get access to such as user analytics and Google/social metrics.

I'll be taking any relevant customisations back to the boilerplate for another edition, looking at any appropriate sports competitions that might benefit from a dedicated calendar. It's funny though; the Venn diagram of sports enjoyed by geeks is quite limited so it's tricky to find a sport that the tech community will want to work on.

I also want to create a website to promote the template and encourage others to get involved. Whilst Github is an amazing platform for open-source communities, I want to substantiate the project with more context and plans. Again, I'll be looking at suitable tools and frameworks to build that site, reaching out to my network to support me with it.

[Rugby World Cup Times](https://rugbyworldcuptimes.com/) was a great opportunity to learn new tech and apply my learnings over the years to another project I enjoy. This is definitely not the end of my sports calendar niche I've always advocated.

🔗 [rugbyworldcuptimes.com](https://rugbyworldcuptimes.com/)
