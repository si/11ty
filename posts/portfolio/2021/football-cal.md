---
title: "Football Cal"
date: 2021-06-09
categories: 
  - "portfolio"
tags: 
  - "calendars"
  - "euro-2020"
  - "football"
  - "gatsby"
  - "open-source"
  - "website"
coverImage: "Football-Cal-desktop.png"
---

## What is Football Cal?

[Football Cal](http://footballcal.com) is _another_ sports calendar web app to provide game times directly to device calendars (iOS, macOS, Android, Windows), returning to the original football focus like World Cup Kick Off.

![](/img/assets/2021/06/Football-Cal-desktop.png)

## Why another football calendar?

1. I've not touched any code for a while whilst focused on podcasting and communities, so I was keen to build something that would be useful to me and others might benefit from.
2. There's still no reliable source for football calendars - even UEFA (who we advised on the power of ICS) make it difficult to find and subscribe to their fixtures. Hence why I focused on the EURO's for the initial release.
3. It's time to practice some of the delivery principles I champion on a daily basis for the past few years, utilising my knowledge and experience from agile software delivery.

## How was it done?

- Restore [The Sports Times](https://sportstimes.website/) template from [Rugby World Cup](https://rugbyworldcuptimes.com) 2 years ago
- Familiar codebase (with JavaScript and Node) plus a chance to reuse an existing tech stack rather than build something from scratch
- Created a dedicated [GitHub repo](https://github.com/sportstimes/footballcal/) (rather than [Rugby World Cup feature branch](https://github.com/sportstimes/gatsby-template/tree/rugby-world-cup))
- Plan out and dreak down work as [Trello cards](https://trello.com/invite/b/KYdByEKj/8ca5511ce5b058b6bbf0f7612636085d/football-cal-%E2%9A%BD%EF%B8%8F), categorised and prioritised to deliver the MLP (Minimum _Loveable_ Product)
- Redesign original template with retro football style, refined timeline view and subtle improvements on the event view
- Spent over a week working on the **Football Cal** (FC) branding with a number of ideas thrown around, using the calendar grid as simply as possible
- Regular feedback from our [On The Side community](https://ontheside.network/) with design and technical wisdom plus a few football fans as target audience to direct requirements
- Continue to refine the MLP scope based on _required_ features and _desirable_ improvements
- Alpha release(s) to user test with small public sample group through a Twitter invite
- Beta test final product through public tweets, validating the purpose and ease of use
- Launched one week before EURO 2020 competition commenced - enough time for people to be aware it's coming but maybe not planned around it
- NPM troubles with Google Analytics plug-in due to outdated Gatsby versions - quick fix with paid Netlify analytics then React Helmet injection using [Plausible](https://plausible.io/footballcal.com) (privacy friendly tracking, GDPR consent friendly)

<figure>

- <figure>
    
    ![](/img/assets/2021/06/Football-Cal-Timeline-Mobile.png)
    
    <figcaption>
    
    Timeline view
    
    </figcaption>
    
    </figure>
    
- <figure>
    
    ![](/img/assets/2021/06/Football-Cal-Event-Mobile.png)
    
    <figcaption>
    
    Event view
    
    </figcaption>
    
    </figure>
    

</figure>

## Whats next for Football Cal?

- [Trello board](https://trello.com/invite/b/KYdByEKj/8ca5511ce5b058b6bbf0f7612636085d/football-cal-%E2%9A%BD%EF%B8%8F) is public to share and influence the roadmap with upvoting available to judge demand
- Chip away at improvements based on user demand, monitoring analytics and feedback
- Add more competitions for extra content and audience reach, possibly some grass-roots fixtures
- Code is available in [GitHub](https://github.com/sportstimes/footballcal/) for collaboration; events are just Markdown files so easy to modify and add more
- Build the audience through [socials](http://twitter.com/footballcal), blogs and other content channels (don't just rely on the "build it and they'll come" analogy)
- Syndicate content through RSS and other triggers (Microformats, Structured Data, even Zapier?)
