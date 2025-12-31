---
title: "I'm Si Jobling"
date: 2021-06-09
coverImage: "Si-coaching-at-Akkroo-March-2019-16-9.jpg"
---

## About Si

Si Jobling is an engineering manager at ASOS (formerly Ant Group, Yahoo!, and UEFA) with decades of experience in web technology. He has built community and podcast projects such as Derby County fanbase, House Finesse, and Multipack to bring people together around shared passions. Learn more on the [About page](/about/).

## Latest posts

{% assign recent_posts = collections.homeRecentPosts | reverse %}
<ul>
{% for post in recent_posts %}
  <li>
    <a href="{{ post.url | url }}">{% if post.data.title %}{{ post.data.title }}{% else %}<code>{{ post.url }}</code>{% endif %}</a>
    <time datetime="{{ post.date | htmlDateString }}">{{ post.date | readableDate }}</time>
  </li>
{% endfor %}
</ul>

## Featured projects

![PETALS cover](images/PETALS-collection.png)

[PETALS](/petals/)

![Make Life Work cover](images/Make-Life-Work-3000x1000-scaled.png)

[Make Life Work](/make-life-work/)

![House Finesse cover](images/HF24-Opengraph-1024x576.png)

[House Finesse](https://housefinesse.com/)
