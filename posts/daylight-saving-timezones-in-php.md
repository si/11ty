---
title: "Daylight Saving Timezones in PHP"
date: "2010-07-15"
categories: 
  - "tips"
tags: 
  - "daylight-saving-time"
  - "dst"
  - "php"
  - "putenv"
  - "timezone"
layout: layouts/post.njk
---

I've long had issues working with timezones in PHP, especially when it comes to coping with [Daylight Saving Time](http://en.wikipedia.org/wiki/Daylight_saving_time) - the annoying inconsistent flexibility of shifting local times back and forward an hour for the Summer.

Recently, I've been using the `putenv` function to hardcode a timezone to an application, eg. for Greenwich Mean Time (GMT):

```php
putenv('TZ=GMT');
```

The problem with this is it doesn't cater for Summer timezones eg. _BST_ for British Summer Time.

I realised this morning that the value can actually be set to one of the many [timezone locations](http://php.net/manual/en/timezones.php) rather than just a timezone code. Eg:

```php
putenv('TZ=Europe/London');
```

Using this, you can rely on the server to work out whether you are in Daylight Saving Time or not based on the specified location and current date.

I've implemented this on a CakePHP website (configured in `config/bootstrap.php` for those who use CakePHP) and it worked straight away.
