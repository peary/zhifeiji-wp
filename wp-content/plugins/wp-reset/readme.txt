=== WP Reset - Fastest WordPress Reset Plugin ===
Tags: wordpress reset, reset wordpress, reset database, reset wordpress database, reset, restart wordpress, clean wordpress, default wp, default wordpress, reset wp, wp reset, developer, wp-cli
Contributors: WebFactory, wpreset
Requires at least: 4.0
Requires PHP: 5.2
Tested up to: 4.9
Stable tag: 1.25
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

WordPress Reset resets any WordPress site to the default values without modifying any files. It deletes all customizations and content. Safe to use.

== Description ==

<a href="https://wpreset.com/?utm_source=wordpressorg&utm_medium=content&utm_campaign=wp-reset&utm_term=wp-reset-top">WP Reset</a> quickly resets the site's database to the default installation values without modifying any files. It deletes all customizations and content. WP Reset is fast and safe to use. It has multiple fail-safe mechanisms so you can never accidentally lose data. WP Reset is extremely helpful for plugin and theme developers. It **speeds up testing and debugging** by providing a quick way to reset settings and re-test code. It was developed by developers for developers.
For support please use the <a href="https://wordpress.org/support/plugin/wp-reset">forums</a>, and if you need more information visit <a href="https://wpreset.com/?utm_source=wordpressorg&utm_medium=content&utm_campaign=wp-reset&utm_term=wpreset.com">wpreset.com</a> and be sure to check out the <a href="https://wpreset.com/roadmap/?utm_source=wordpressorg&utm_medium=content&utm_campaign=wp-reset&utm_term=roadmap">roadmap</a> for the list of upcoming features.

Access WP Reset admin page via the "Tools" menu.


**Please read carefully before proceeding to understand what WP Reset does**

#### Resetting will delete:

* all posts, pages, custom post types, comments, media entries, users
* all default WP database tables
* all custom database tables that have the same prefix table prefix as the one defined in _wp-config.php_ and used by default tables

#### Resetting will not delete or modify:

* media files - they remain in the _wp-uploads_ folder untouched but will no longer be listed under Media in admin
* no files are touched; plugins, themes, uploads - everything stays
* site title, WordPress address, site address, site language and search engine visibility settings
* currently logged in user will be restored with the current username and password

#### What happens when I click the Reset button?

* you will have to confirm the action one more time because there is NO UNDO
* everything will be reset; see bullets above for details
* site title, WordPress address, site address, site language, search engine visibility settings as well as the current user will be restored
* you will be logged out, automatically logged in and taken to the admin dashboard
* WP Reset plugin will be reactivated if that option is chosen in the post-reset options

#### WP-CLI support

WP Reset comes with full WP-CLI support. Help on our WP-CLI commands is available via _wp help reset_. By default the commands have to be confirmed but you can use the `--yes` option to skip confirmation. Instead of the active user, the first user with admin privileges found in the database will be restored after reset. Please be careful when using WP Reset with WP-CLI - as with using the GUI there is no undo.

#### Multisite (WP-MU) Support

WP Reset has yet to be completely tested with multisite! Please be careful when using it with multisite enabled. We don't recommend to resetting the main site. Sub-sites should be OK. We're working on making WP Reset fully compatible with WP-MU. Till then please be careful. Thank you for understanding.


== Installation ==

Follow the usual routine;

1. Open WordPress admin, go to Plugins, click Add New
2. Enter "wp reset" in search and hit Enter
3. Plugin will show up as the first on the list (look for our black&red round logo), click "Install Now"
4. Activate & open plugin's settings page located under the Tools menu

Or if needed, upload manually;

1. Download the latest stable version from from <a href="https://downloads.wordpress.org/plugin/wp-reset.latest-stable.zip">downloads.wordpress.org/plugin/wp-reset.latest-stable.zip</a>
2. Unzip it and upload to _/wp-content/plugins/_
3. Open WordPress admin - Plugins and click "Activate" next to "WP Reset"
4. Open plugin's admin page located under the Tools menu


== Screenshots ==

1. WP Reset admin page
2. Reset action has to be double-confirmed


== Changelog ==

= v1.25 =
* 2018/07/31
* code clean-up
* post-reset options - reactivate plugin, themes & WP Reset
* added WP-MU warning till we make WP Reset fully compatible with it
* Tidy Repo notice
* added option to collapse boxes
* modified rating notice

= v1.20 =
* 2018/07/09
* we hit 40k installations on 2018/06/26
* WP-CLI support via "wp reset" command
* new logo
* ask for rating notice
* GUI improvements
* code clean up
* preparations for further development and new features

= v1.10 =
* 2018/05/09
* WebFactory took over development
* numerous bug fixes and improvements
* 30,000 installations; 199,000 downloads

= v1.0 =
* 2016/05/16
* Initial release

== Frequently Asked Questions ==

= How can I log in after resetting? =

Use the same username and password you used while doing the reset. Only one user will be restored after resetting. The one you used at that time.

= Will any files be deleted or modified? =

No. All files are left untouched.

= Will I have to reconfigure wp-config.php? =

Absolutely not. No reconfiguration is needed. No files are modified.

= Do you support WP-CLI? =

We sure do! Just type "wp reset" in your shell to see the list of available commands and options.

= How long does it take for the reset operation to complete? =

On most installations a second or two. If you have a huge amounts of data in tables then up to ten seconds.
