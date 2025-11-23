---
title: "Moving WordPress to Linode"
date: 2018-12-18
categories: 
  - "blog"
tags: 
  - "cloudflare"
  - "linode"
  - "site-migration"
  - "wordpress"
---

I recently decided to give this blog some much-needed love and attention by moving to [Linode](https://linode.com/). Following a friend's suggestion, it seems only appropriate to share the reasons and process.

## The Problem

As a rule, I’ve always tried to keep website costs to a minimum until it can be justified to increase the outgoings for improved architecture. I’ve long had a shared web server for running all my side projects which ticks over nicely for low traffic websites. Unfortunately, my own website has never really warranted the necessary extra expense.

That said, the shared server can struggle under the strain of traffic spikes and demanding resources on Wordpress updates and rogue plugins. Over the last year, I’ve had a number of occasions where the server failed to respond with 50X errors which affects all the other side projects on the same server.

As I try to find ways to claim back my content from social media outlets (like [Twitter](https://twitter.com/Si) and [Instagram](https://instagram.com/sijobling)), the natural channel would be my own website. To support this, it made sense to give the site a more reliable and speedy environment to live. Enter [Linode](https://linode.com/).

## Why Linode?

I’ve been using Linode to host a couple other Wordpress (podcast) websites for a while now - [House Finesse](https://housefinesse.com/) and [Verbal Diary](https://verbaldiary.show/). These have both proved to work perfectly, even under peak traffic when episodes are released. This was testament to the performance requirements I was looking for.

After setting up two other websites with WordPress on separate Linodes, I also had a proven boilerplate to setup the necessary environment with minimal fuss.

With all that preamble, I’m sure you’re keen to get into the how. Let’s do it…

## Step 1 – Back It Up

Like all site migrations, always backup your content, data and configuration. As this was a simple lift and shift, it was relatively straight forward exercise for me.

1. Login to your current server’s control panel, whether it’s cPanel, WHM or SSH.
2. Locate your website on the file system (e.g. `/var/www/html/yourwebsite.tld/`
3. Create an archive of the site’s `wp-content` directory e.g. `wp-content.zip`, ideally accessible publicly under the `public_html` directory,.
4. Alternatively, if your website content gets quite large to manage, create individual archives for each area, e.g. `uploads-2018.zip`, `uploads-2018-11.zip`, `plugins.zip`
5. I also recommend taking a copy of the your local `wp-config.php` file as this contains some vital information for your website. **Do not make this publicly available though.**
6. Time to take a backup of your database. If you have phpMyAdmin handy, this is quite straight forward. For convenience, store a backup with a cryptic ZIP filename in your `public_html` directory - this will help later on as a temporary migration.

## Step 2 – Spin Up

I chose [Linode](https://linode.com/) for this but I imagine [Digital Ocean](https://digitalocean.com/) or other hosting providers will be equally capable.

1. If you’re new to Linode, create an account and enter your billing details.
2. Head over to the [StackScripts](https://www.linode.com/stackscripts/) section and search for “wordpress”.
3. I used the recent stable build (CentOS 7, Debian 8, Ubuntu 14.04 LTS) but most LAMP configurations will work.
4. Once built and running, SSH to your instance with _root_ access.
5. Navigate to your web-server root, probably `/var/www/html`.
6. Create a new directory for your website `your-site.tld` and `public_html` directory within.
7. Navigate to your `/etc/apache2/sites-available` directory.
8. Duplicate the `default.conf` file to `your-site.tld.conf`
9. Edit `your-side.tld.conf` file and set all the necessary variables (`ServerName`, `DocumentRoot`, `ErrorLog` and `CustomLog`)
10. Enable your new site with the command `sudo a2ensite your-site.tld.conf`
11. Restart the web server with `service apache2 reload`.

## Step 3 – WGET All The Things

I often find it difficult to copy files between servers and there’s probably much better ways to do this but I found pulling files from your original server to be the simplest approach with WGET and UNZIP and allows you to keep a close eye on each step.

1. Make sure WGET is installed with `sudo yum install wget`.
2. You’ll also need the ZIP library installed with `sudo yum install unzip`.
3. Navigate to your site directory `/var/www/html/your-site.tld/` - not the `public_html` directory.
4. Download the _wp-content.zip_ file with the command `wget http://your-site.tld/wp-content.zip`
5. If you decided to compress more granular directories earlier on, download them one-by-one instead.
6. Once transferred, uncompress your content archives with the command `unzip wp-content.zip`
7. Finally, grab the database dump from your original server with `wget http://your-site.tld/some-cryptic-name-345734.sql.zip`
8. **I now recommend deleting or moving the data dump on your original server before any cheeky rogues discover it.**

## Step 4 – Data Import

Now you’ve got all the necessary files on your new server, you need to import the data. This should be relatively straight forward if you’re familiar with typical MySQL configurations.

1. Make sure MySQL is installed and running a suitable version by checking `mysql -v` on your server.
2. Connect to the MySQL server as root user: `mysql -u root -p`
3. Create a new database for your website: `CREATE DATABASE your_site_name;`
4. Create a dedicated user for accessing this database: `CREATE USER your_site_username;`
5. Give your new user access to the new database: `GRANT ACCESS ALL your_site_username@your_site_name;`
6. Log out from the MySQL server and make sure you’re located in your site parent folder: `cd /var/www/html/your-site.tld/`
7. Uncompress the transferred SQL dump from your original cryptic archive: `unzip some-cryptic-name-345734.sql`
8. Import the data from your uncompressed SQL dump into your new database: `mysql -u root -p your_site < some-cryptic-name-345734.sql`
9. If you get errors about `COLLATE` types, edit the SQL file replacing any references to `COLLATE utf8mb4_unicode_ci`.

## Step 5 - Configuration

It’s coming together now. We just need to make sure Wordpress is configured correctly. I found a few little gotchas that might help others.

1. Open your `wp-config.php` file in a text editor. I use `nano wp-config.php`
2. Set your database variables to your new database settings from earlier;
    - DB\_NAME: your\_site
    - DB\_USER: your\_site\_username
    - DB\_PASSWORD:
    - DB\_HOST: `localhost`
3. Make sure `$table_prefix` is set correctly - my previous installation included a random string that was different which caught me out.
4. Append the following code to the end of your file to support theme and plugin installations in the WordPress control panel - otherwise you’ll be prompted for FTP settings: `define('FS_METHOD', 'direct');`

## Step 5 – Preview Mode

Before the site was switched over, I wanted to preview it in it’s new home with minimum fuss. Thanks to using [Cloudflare](https://cloudflare.com/) for name servers, this was quite simple.

1. Login to [Linode’s new Cloud UI](https://cloud.linode.com/) and open your new Linode’s details.
2. On the Summary tab, find your IP address.
3. In Cloudflare, head to the DNS settings for your domain and create an A record to point at your new server’s IP address - I used the name `2018` for convenience.
4. Log back in to your Linode instance over SSH (or use their Weblish console if you prefer).
5. Open up `/etc/apache2/sites-available/your-site.tld.conf` in a text editor
6. Add a `ServerAlias` rule for your temporary sub-domain, e.g. `ServerAlias 2018.your-site.tld`
7. Save your .conf file.
8. Make sure your new site configuration is enabled: `sudo a2ensite your-site.tld`
9. Restart your web server: `service apache2 reload`
10. Connect to your MySQL server: `mysql -u root -p`
11. Choose your site’s database: `USE your_site;`
12. Check the first two records in the options table are your website’s URL: `SELECT * FROM wp_options WHERE option_id = 1 OR option_id = 2;`
13. If so, you can now set your site’s URL and homepage with your temporary sub-domain: `UPDATE wp_options SET option_value = 'https://2018.your-site.tld' WHERE option_id = 1 OR option_id = 2;`
14. Disconnect from your MySQL server (a simple `exit;` will do)

## Step 6 - Test

All being well, your new website should now be working on your temporary domain. In a browser, head over to your new URL and check the following:

- All blog posts and pages load correctly
- Your content assets (images etc) are still referencing your live server - this should be fine when you switch and saves hassle of updating all your content
- Login to your admin panel is successful, either with local authentication or [Wordpress.com](http://Wordpress.com) SSO.
- Upload some media to check the correct file permissions on the uploads directory (**Pro tip**: make a note of your newly uploaded media - this will come in useful when testing you’re switch-over)
- Install a new plugin and remove it (further file permissions check)
- Edit your theme files - you don’t need to change anything, just save an existing file. (Alternatively, append a `data-server=“linode”` attribute to your <`html>` tag in _header.php_ \- again, useful for switch-over)

## Step 7 – Switch Over

Now you’re confident the site is setup correctly on your new server, it’s a simple update to change your name servers (thanks to Cloudflare).

1. Login to your new WordPress Admin and head to the Settings
2. Set your website and blog fields back to the live URL without the sub-domain prefix (e.g. your-site.tld)
3. Log back into Cloudflare and open your site settings
4. In the DNS settings, find the A record for your live website your-site.tld
5. Copy the IP address from your temporary A record (e.g. 2018.your-site.tld) and paste it to the live website field. (**Note**: Being Cloudflare, this will happen almost instantaneously so be prepared)
6. Head to your website in a browser and smoke test all is well. Check that test media URL you uploaded earlier or inspect your source code looking for the `data-server` attribute.

## Step 8 – Wash Up

Now that your website is moved to it’s shiny new home, it’s time to clear up all the remnants from previous efforts.

- Clear out the temporary A record from Cloudlflare (e.g. `2018.your-site.tld`)
- Tear down the previous hosting instance including the Wordpress site, all wp-content, MySQL database table and backup files we transferred

That’s it. Hopefully, this process is useful to others who are considering WordPress site migrations to a dedicated server. I’m definitely reaping the benefits of the performance improvements and it’s motivating me to write more content. If you’ve got any suggestions to improve this workflow, please let me know and I’ll update it for others to benefit.
