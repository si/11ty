---
title: "6 WordPress Defaults You Don't Need"
date: 2015-03-27
categories: 
  - "blog"
tags: 
  - "configuration"
  - "tips-2"
  - "wordpress"
coverImage: "Wordpress-Defaults.png"
---

8% of the Web is run on Wordpress (based on [74.6m](https://managewp.com/14-surprising-statistics-about-wordpress-usage) out of [919m live sites](http://www.internetlivestats.com/total-number-of-websites/)).

What that figure probably doesn't tell you is how many are set to the default settings and how, with a few minor changes, you can improve your search engine ranking, website security and fundamental usability faux-pas.

I've purposely avoided any additional plugins to keep this simple. These are some simple changes to Wordpress "out the box" that I go through every time.

## Tip #1: Remove “Powered by WordPress”

Automattic (the team behind WordPress) are reeling in the endless link-backs from all those websites. Link-backs are a legacy mechanism to improve search engine ranking. This rule comes with a number of caveats now but still stay true in the fundamentals of SEO. Automattic don't need this link juice and it's only opening up security implications to potential hackers who want to break in to your site.

Pop in to your theme folder (in _Appearance > Editor_), open the _footer.php_ file and remove the link:

```
<a href="http://wordpress.org/" rel="generator"><?php printf( __( 'Proudly powered by %s' ), 'WordPress' ); ?></a>
```

## Tip #2: Remove the WordPress version meta tag

Similar to the 1st tip, this is only there to provide Automattic some useful statistics when they scan your site from the link-back. It also tells any hackers how to get around the (relatively poor) security layers in your version of WordPress.

Back in your theme folder, open the _function.php_ file and add the following line:

```
remove_action('wp_head', 'wp_generator');
```

## Tip #3: Disable comments globally

Originally a brilliant way to engage with your visitors, these pests are now synonymous with ruthless spammers/spambots trying to improve their website with pointless link-backs (most links in comments append the `rel="nofollow"` attribute which essentially tells Google to ignore it). Comments rarely add any value to your content anymore with the rise of social media and more elegant solutions for engagement.

Head to _Settings > Discussion_ and uncheck “_Allow people to post comments on new articles_”.

(You might also want to install the Disable Comments **plugin** which disables comments on all existing posts and pages too.)

## Tip #4: Remove the Meta widget

The idea behind this widget is wonderful – it demonstrates some fundamental features baked into WordPress for accessing open data such as RSS feeds and sitemaps. Take note of those generated URLs for the future. However, it also offers the public a nice easy way to access your website CMS, as well as confirming the login URL to any would-be hackers.

Head over to your theme's _Appearance > Widgets_ and remove the widget from your sidebar.

## Tip #5: Disable registration

By default, anybody can sign up to your website (as part of the originally enabled comments system). By doing so, anyone can access your administration albeit with limited functionality. Don't leave it to chance though – there are some naughty folk out there, preying on the naive.

In your _Settings > General_, uncheck “_Anyone can register_”.

## Tip #6: Customise your permalinks

Up until recently, the default setting for WordPress permalinks (or URLs to the rest of us) was to use querystring parameters such as _?p=123_ and _?cat=12_. Similarly to our early tips, this is a dead giveaway to any potential hackers of what is powering your website. If your hosting provider allows, you should change your URL structure to something more organised, user-friendly and prone to hacking.

Under _Settings > Permalinks_, choose one of the options that uses the name of your post – I prefer _Post Name_ or a custom “/%category%/%postname%/”.
