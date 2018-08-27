<?php
/*
  Plugin Name: WP Reset
  Plugin URI: https://wpreset.com/
  Description: Reset the site to default installation values without modifying any files. Deletes all customizations and content.
  Version: 1.25
  Author: WebFactory Ltd
  Author URI: https://www.webfactoryltd.com/
  Text Domain: wp-reset

  Copyright 2015 - 2018  Web factory Ltd  (email: wpreset@webfactoryltd.com)

  This program is free software; you can redistribute it and/or modify
  it under the terms of the GNU General Public License, version 2, as
  published by the Free Software Foundation.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program; if not, write to the Free Software
  Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

// include only file
if (!defined('ABSPATH')) {
	wp_die(__('Do not open this file directly.', 'wp-error'));
}


// load WP-CLI commands, if needed
if (defined('WP_CLI') && WP_CLI) {
  require_once dirname( __FILE__ ) . '/wp-reset-cli.php';
}


class WP_Reset {
  protected static $instance = null;
  public $version = 0;
  public $plugin_url = '';
  public $plugin_dir = '';
  protected $options = array();


  /**
   * Creates a new WP_Reset object and implements singleton
   * 
   * @return WP_Reset
   */
  static function getInstance() {
    if (!is_a(self::$instance, 'WP_Reset')) {
      self::$instance = new WP_Reset();
    }

    return self::$instance;
  } // getInstance


  /**
   * Initialize properties, hook to filters and actions
   * 
   * @return null
   */
  private function __construct() {
    $this->version = $this->get_plugin_version();
    $this->plugin_dir = plugin_dir_path(__FILE__);
    $this->plugin_url = plugin_dir_url(__FILE__);
    $this->load_options();
    
    add_action('admin_menu', array($this, 'admin_menu'));
    add_action('admin_init', array($this, 'do_all_actions'));
    add_action('admin_enqueue_scripts', array($this, 'admin_enqueue_scripts'));
    add_action('wp_ajax_wp_reset_dismiss_notice', array($this, 'ajax_dismiss_notice'));
    
    add_filter('plugin_action_links_' . plugin_basename(__FILE__), array($this, 'plugin_action_links'));
    add_filter('plugin_row_meta', array($this, 'plugin_meta_links'), 10, 2);
    add_filter('admin_footer_text', array($this, 'admin_footer_text'));
  } // __construct

  
  /**
   * Get plugin version from file header
   * 
   * @return string
   */
  function get_plugin_version() {
    $plugin_data = get_file_data(__FILE__, array('version' => 'Version'), 'plugin');

    return $plugin_data['version'];
  } // get_plugin_version
  

  /**
   * Load and prepare the options array
   * If needed create a new DB entry
   * 
   * @return array
   */
  private function load_options() {
    $options = get_option('wp-reset', array());
    $change = false;

    if (!isset($options['meta'])) {
      $options['meta'] = array('first_version' => $this->version, 'first_install' => current_time('timestamp', true), 'reset_count' => 0);
      $change = true;
    }
    if (!isset($options['dismissed_notices'])) {
      $options['dismissed_notices'] = array();
      $change = true;
    }
    if (!isset($options['last_run'])) {
      $options['last_run'] = array();
      $change = true;
    }
    if (!isset($options['options'])) {
      $options['options'] = array();
      $change = true;
    }
    if ($change) {
      update_option('wp-reset', $options, true);
    }
    
    $this->options = $options;
    return $options;
  } // load_options


  /**
   * Get meta part of plugin options
   * 
   * @return array
   */
  function get_meta() {
    return $this->options['meta'];
  } // get_meta


  /**
   * Get all dismissed notices, or check for one specific notice
   * 
   * @return bool|array
   */
  function get_dismissed_notices($notice_name = '') {
    $notices = $this->options['dismissed_notices'];

    if (empty($notice_name)) {
      return $notices;
    } else {
      if (empty($notices[$notice_name])) {
        return false;
      } else {
        return true;
      }
    }
  } // get_dismissed_notices


  /**
   * Get options part of plugin options
   * 
   * todo: not completed
   * 
   * @return array
   */
  function get_options($key = '') {
    return $this->options['options'];
  } // get_options


  /**
   * Update plugin options, currently entire array
   * 
   * todo: this handles the entire options array although it should only do the options part - it's confusing
   * 
   * @return bool
   */
  function update_options($key, $data) {
    $this->options[$key] = $data;
    $tmp = update_option('wp-reset', $this->options);

    return $tmp;
  } // set_options

  
  /**
   * Add plugin menu entry under Tools menu
   * 
   * @return null
   */
  function admin_menu() {
    add_management_page(__('WP Reset', 'wp-reset'), __('WP Reset', 'wp-reset'), 'administrator', 'wp-reset', array($this, 'plugin_page'));
  } // admin_menu


  /**
   * Dismiss notice via AJAX call
   * 
   * @return null
   */
  function ajax_dismiss_notice() {
    check_ajax_referer('wp-reset_dismiss_notice');

    $notice_name = trim(@$_GET['notice_name']);
    if (!$this->dismiss_notice($notice_name)) {
      wp_send_json_error('Notice is already dismissed.');
    } else {
      wp_send_json_success();
    }
  } // ajax_dismiss_notice


  /**
   * Dismiss notice by adding it to dismissed_notices options array
   * 
   * @return bool
   */
  function dismiss_notice($notice_name) {
    if ($this->get_dismissed_notices($notice_name)) {
      return false;
    } else {
      $notices = $this->get_dismissed_notices();
      $notices[$notice_name] = true;
      $this->update_options('dismissed_notices', $notices);
      return true;
    }
  } // dismiss_notice


  /**
   * Enqueue CSS and JS files
   * 
   * @return null
   */
  function admin_enqueue_scripts($hook) {
    // exit early if not on WP Reset page
    if ('tools_page_wp-reset' != $hook) {
      return;
    }
    
    $options = $this->get_options();

    $js_localize = array('undocumented_error' => __('An undocumented error has occured. Please refresh the page and try again.', 'wp-reset'),
                         'plugin_name' => __('WP Reset', 'wp-reset'),
                         'settings_url' => admin_url('tools.php?page=wp-reset'),
                         'icon_url' => $this->plugin_url . 'img/wp-reset-icon.png',
                         'invalid_confirmation' => __('Please type "reset" in the confirmation field.', 'wp-reset'),
                         'invalid_confirmation_title' => __('Invalid confirmation', 'wp-reset'),
                         'cancel_button' => __('Cancel', 'wp-reset'),
                         'ok_button' => __('OK', 'wp-reset'),
                         'confirm_button' => __('Reset WordPress', 'wp-reset'),
                         'confirm_title' => __('Are you sure you want to proceed?', 'wp-reset'),
                         'confirm1' => __('Clicking "Reset WordPress" will reset your site to default values. All content will be lost. There is NO UNDO.', 'wp-reset'),
                         'confirm2' => __('Click "Cancel" to abort.', 'wp-reset'),
                         'doing_reset' => __('Resetting in progress. Please wait.', 'wp-reset'),
                         'nonce_dismiss_notice' => wp_create_nonce('wp-reset_dismiss_notice'),
                         'nonce_do_reset' => wp_create_nonce('wp-reset_do_reset'));

    wp_enqueue_style('wp-reset', $this->plugin_url . 'css/wp-reset.css', array(), $this->version);
    wp_enqueue_style('wp-reset-sweetalert2', $this->plugin_url . 'css/sweetalert2.min.css', array(), $this->version);

    wp_enqueue_script('wp-reset-sweetalert2', $this->plugin_url . 'js/sweetalert2.min.js', array('jquery'), $this->version, true);
    wp_enqueue_script('wp-reset', $this->plugin_url . 'js/wp-reset.js', array('jquery'), $this->version, true);
    wp_localize_script('wp-reset', 'wp_reset', $js_localize);

    // fix for aggressive plugins that include their CSS on all pages
    wp_dequeue_style('uiStyleSheet');
    wp_dequeue_style('wpcufpnAdmin' );
    wp_dequeue_style('unifStyleSheet' );
    wp_dequeue_style('wpcufpn_codemirror');
    wp_dequeue_style('wpcufpn_codemirrorTheme');
    wp_dequeue_style('collapse-admin-css');
    wp_dequeue_style('jquery-ui-css');
    wp_dequeue_style('tribe-common-admin');
    wp_dequeue_style('file-manager__jquery-ui-css');
    wp_dequeue_style('file-manager__jquery-ui-css-theme');
    wp_dequeue_style('wpmegmaps-jqueryui');
    wp_dequeue_style('wp-botwatch-css');
  } // admin_enqueue_scripts
  

  function is_cli_running() {
    if (defined('WP_CLI') && WP_CLI) {
      return true;
    } else {
      return false;
    }
  } // is_cli_running


  /**
   * Reinstall / reset the WP site
   * There are no failsafes in the function - it reinstalls when called
   * Redirects when done
   * 
   * @return null
   */
  function do_reinstall($params = array()) {
    global $current_user, $wpdb;

    // only admins can reset; double-check
    if (!$this->is_cli_running() && !current_user_can('administrator')) {
      return false;
    }

    // make sure the function is available to us
    if (!function_exists('wp_install')) {
      require ABSPATH . '/wp-admin/includes/upgrade.php';
    }

    // save values that need to be restored after reset
    // todo: use params to determine what gets restored after reset
    $blogname = get_option('blogname');
    $blog_public = get_option('blog_public');
    $wplang = get_option('wplang');
    $siteurl = get_option('siteurl');
    $home = get_option('home');
    
    $active_plugins = get_option('active_plugins');
    $active_theme = wp_get_theme();

    // for WP-CLI
    if (!$current_user->ID) {
      $tmp = get_users(array('role' => 'administrator', 'order' => 'ASC', 'order_by' => 'ID'));
      if (empty($tmp[0]->user_login)) {
        return new WP_Error('no_user', 'Reset failed. Unable to find any admin users in database.');
      }
      $current_user = $tmp[0];
    }

    // delete custom tables with WP's prefix
    $prefix = str_replace('_', '\_', $wpdb->prefix);
    $tables = $wpdb->get_col("SHOW TABLES LIKE '{$prefix}%'");
    foreach ($tables as $table) {
      $wpdb->query("DROP TABLE $table");
    }

    // supress errors for WP_CLI
    // todo: do something better
    $result = @wp_install($blogname, $current_user->user_login, $current_user->user_email, $blog_public, '', md5(rand()), $wplang);
    $user_id = $result['user_id'];

    // restore user pass
    $query = $wpdb->prepare("UPDATE {$wpdb->users} SET user_pass = %s, user_activation_key = '' WHERE ID = %d LIMIT 1", array($current_user->user_pass, $user_id));
    $wpdb->query($query);

    // restore rest of the settings including WP Reset's
    update_option('siteurl', $siteurl);
    update_option('home', $home);
    update_option('wp-reset', $this->options);

    // remove password nag
    if (get_user_meta($user_id, 'default_password_nag')) {
      update_user_meta($user_id, 'default_password_nag', false);
    }
    if (get_user_meta($user_id, $wpdb->prefix . 'default_password_nag')) {
      update_user_meta($user_id, $wpdb->prefix . 'default_password_nag', false );
    }

    $meta = $this->get_meta();
    $meta['reset_count']++;
    $this->update_options('meta', $meta);

    // reactivate theme
    if (!empty($params['reactivate_theme'])) {
      switch_theme($active_theme->get_stylesheet());
    }

    // reactivate WP Reset
    if (!empty($params['reactivate_wpreset'])) {
      activate_plugin(plugin_basename( __FILE__ ));
    }

    // reactivate all plugins
    if (!empty($params['reactivate_plugins'])) {
      foreach ($active_plugins as $plugin_file) {
        activate_plugin($plugin_file);
      } 
    }

    if (!$this->is_cli_running()) {
      // log out and log in the old/new user
      // since the password doesn't change this is potentially unnecessary
      wp_clear_auth_cookie();
      wp_set_auth_cookie($user_id);

      wp_redirect(admin_url() . '?wp-reset=success');
      exit;
    }
  } // do_reinstall
  

  /**
   * checks wp_reset post value and performs all actions
   * todo: handle messages for various actions
   */
  function do_all_actions() {
    // only admins can perform actions
    if (!current_user_can('administrator')) {
      return;
    }

    if (!empty($_GET['wp-reset']) && stristr($_SERVER['HTTP_REFERER'], 'wp-reset')) {
      add_action('admin_notices', array($this, 'notice_successfull_reset'));
    }

    // check nonce
    if (true === isset($_POST['wp_reset_confirm']) && false === wp_verify_nonce(@$_POST['_wpnonce'], 'wp-reset')) {
      add_settings_error('wp-reset', 'bad-nonce', __('Something went wrong. Please refresh the page and try again.', 'wp-reset'), 'error');
      return false;
    }
   
    // check confirmation code
    if (true === isset($_POST['wp_reset_confirm']) && 'reset' !== $_POST['wp_reset_confirm']) {
      add_settings_error('wp-reset', 'bad-confirm', __('<b>Invalid confirmation code.</b> Please type "reset" in the confirmation field.', 'wp-reset'), 'error');
      return false;
    }

    // only one action at the moment
    if (true === isset($_POST['wp_reset_confirm']) && 'reset' === $_POST['wp_reset_confirm']) {
      $defaults = array('reactivate_theme' => '0',
                        'reactivate_plugins' => '0',
                        'reactivate_wpreset' => '0');
      $params = shortcode_atts($defaults, (array) @$_POST['wpr-post-reset']);

      $this->do_reinstall($params);
    }
  } // do_reset


  /**
   * Add "Reset WordPress" action link to plugins table, left part
   * 
   * @return array
   */
  function plugin_action_links($links) {
    $settings_link = '<a href="' . admin_url('tools.php?page=wp-reset') . '" title="' . __('Reset WordPress', 'wp-reset') . '">' . __('Reset WordPress', 'wp-reset') . '</a>';

    array_unshift($links, $settings_link);

    return $links;
  } // plugin_action_links
  
  
  /**
   * Add links to plugin's description in plugins table
   * 
   * @return array
   */
  function plugin_meta_links($links, $file) {
    if ($file !== plugin_basename(__FILE__)) {
      return $links;
    }
    
    $support_link = '<a target="_blank" href="https://wordpress.org/support/plugin/wp-reset" title="' . __('Get help', 'wp-reset') . '">' . __('Support', 'wp-reset') . '</a>';
    $home_link = '<a target="_blank" href="' . $this->generate_web_link('plugins-table-right') . '" title="' . __('Plugin Homepage', 'wp-reset') . '">' . __('Plugin Homepage', 'wp-reset') . '</a>';
    
    $links[] = $support_link;
    $links[] = $home_link;
    
    return $links;
  } // plugin_meta_links


  /**
   * Test if we're on plugin's admin page
   * 
   * @return bool
   */
  function is_plugin_page() {
    $current_screen = get_current_screen();

    if ($current_screen->id == 'tools_page_wp-reset') {
      return true;
    } else {
      return false;
    }
  } // is_plugin_page


  /**
   * Add powered by text in admin footer
   * 
   * @return bool
   */
  function admin_footer_text($text) {
    if (!$this->is_plugin_page()) {
      return $text;
    }

    $text = '<i><a href="' . $this->generate_web_link('admin_footer') . '" title="' . __('Visit WP Reset page for more info', 'wp-reset') . '" target="_blank">WP Reset</a> v' . $this->version . ' by <a href="https://www.webfactoryltd.com/" title="' . __('Visit our site to get more great plugins', 'wp-reset'). '" target="_blank">WebFactory Ltd</a>.</i> '. $text;

    return $text;
  } // admin_footer_text


  /**
   * Loads a plugin's translated strings
   * 
   * @return null
   */
  function load_textdomain() {
    load_plugin_textdomain('wp-reset');
  } // load_textdomain


  /**
   * Inform the user that WordPress has been successfully reset
   * 
   * @return null
   */
  function notice_successfull_reset() {
    global $current_user;

    echo '<div id="message" class="updated fade"><p>' . sprintf(__( '<b>Site has been reset</b> to default settings. User "%s" was restored with the password unchanged. Open <a href="%s">WP Reset</a> to do another reset.', 'wp-reset'), $current_user->user_login, admin_url('tools.php?page=wp-reset')) . '</p></div>';
  } // notice_successfull_reset


  /**
   * Outputs complete plugin's admin page
   * 
   * @return null
   */
  function plugin_page() {
    global $current_user, $wpdb;
    $notice_shown = false;
    $meta = $this->get_meta();

    // double check for admin priv
    if (!current_user_can('administrator')) {
      wp_die(__('Sorry, you are not allowed to access this page.', 'wp-reset'));
    }

    settings_errors();
    echo '<div class="wrap">';
    echo '<h1><img id="logo-icon" src="' . $this->plugin_url . 'img/wp-reset-logo.png" title="' . __('WP Reset', 'wp-reset') . '" alt="' . __('WP Reset', 'wp-reset') . '"></h1>';
    echo '<form id="wp_reset_form" action="' . admin_url('tools.php?page=wp-reset') . '" method="post" autocomplete="off">';

    if (false === $notice_shown && is_multisite()) {
      echo '<div class="card notice-wrapper notice-error">';
      echo '<h2>' . __('WP Reset has not been fully tested with multisite', 'wp-reset') . '</h2>';
      echo '<p>' . __('Please be careful when using WP Reset with multisite enabled. It\'s not recommended to reset the main site. Sub-sites should be OK. We\'re working on making it fully compatible with WP-MU. <b>Till then please be careful.</b> Thank you for understanding.', 'wp-reset') . '</p>';
      echo '</div>';
      $notice_shown = true;
    }
    
    if (!empty($meta['reset_count']) && false === $notice_shown && false == $this->get_dismissed_notices('rate')) {
      echo '<div class="card notice-wrapper">';
      echo '<h2>' . __('Please help us keep the plugin free &amp; up-to-date', 'wp-reset') . '</h2>';
      echo '<p>' . __('If you use &amp; enjoy WP Reset, <b>please rate it on WordPress.org</b>. It only takes a second and helps us keep the plugin free and maintained. Thank you!', 'wp-reset') . '</p>';
      echo '<p><a class="button-primary button" title="' . __('Rate WP Reset', 'wp-reset') . '" target="_blank" href="https://wordpress.org/support/plugin/wp-reset/reviews/#new-post">' . __('Help keep the plugin free - rate it!', 'wp-reset') . '</a>  <a href="#" class="wpr-dismiss-notice dismiss-notice-rate" data-notice="rate">' . __('I\'ve already rated it', 'wp-reset') . '</a></p>';
      echo '</div>';
      $notice_shown = true;
    }
    
    if (false === $notice_shown && $meta['reset_count'] >= 2 && false == $this->get_dismissed_notices('tidy')) {
      echo '<div class="card notice-wrapper">';
      echo '<h2>' . __('Are you a plugin author? Get your plugin reviewed on Tidy Repo', 'wp-reset') . '</h2>';
      echo '<p>' . __('Since 2013 Tidy Repo has been reviewing the best and most reliable WordPress plugins. <b>Submitting a plugin is free</b>, so you have nothing to lose and a lot of exposure to gain when it gets reviewed.', 'wp-reset') . '</p>';
      echo '<p><a class="button-primary button" title="' . __('Rate WP Reset', 'wp-reset') . '" target="_blank" href="https://tidyrepo.com/?utm-campaing=wp-reset-free&utm-medium=plugin&utm_content=notification&utm_campaign=wp-reset-free-v' . $this->version . '">' . __('Let Tidy Repo know you have a great plugin', 'wp-reset') . '</a>  <a href="#" class="wpr-dismiss-notice dismiss-notice-rate" data-notice="tidy">' . __('Thanks, I\'m not interested', 'wp-reset') . '</a></p>';
      echo '</div>';
      $notice_shown = true;
    }

    echo '<div class="card" id="card-description">';
    echo '<a class="toggle-card" href="#" title="' . __('Collapse / expand box', 'wp-reset') . '"><span class="dashicons dashicons-arrow-up-alt2"></span></a>';
    echo '<h2>' . __('Please read carefully before proceeding. There is NO UNDO!', 'wp-reset') . '</h2>';
    echo '<b class="red">' . __('Resetting will delete:', 'wp-reset') . '</b>';
    echo '<ul class="plain-list">';
    echo '<li>' . __('all posts, pages, custom post types, comments, media entries, users', 'wp-reset') . '</li>';
    echo '<li>' . __('all default WP database tables', 'wp-reset') . '</li>';
    echo '<li>' . sprintf(__('all custom database tables that have the same prefix "%s" as default tables in this installation', 'wp-reset'), $wpdb->prefix) . '</li>';
    echo '</ul>';

    echo '<b class="green">' . __('Resetting will not delete:', 'wp-reset') . '</b>';
    echo '<ul class="plain-list">';
    echo '<li>' . __('media files - they\'ll remain in the <i>wp-uploads</i> folder but will no longer be listed under Media', 'wp-reset') . '</li>';
    echo '<li>' . __('no files are touched; plugins, themes, uploads - everything stays', 'wp-reset') . '</li>';
    echo '<li>' . __('site title, WordPress address, site address, site language and search engine visibility settings', 'wp-reset') . '</li>';
    echo '<li>' . sprintf(__('logged in user "%s" will be restored with the current password', 'wp-reset'), $current_user->user_login) . '</li>';
    echo '</ul>';

    echo '<b>' . __('What happens when I click the Reset button?', 'wp-reset') . '</b>';
    echo '<ul class="plain-list">';
    echo '<li>' . __('you will have to confirm the action one more time because there is NO UNDO', 'wp-reset') . '</li>';
    echo '<li>' . __('everything will be reset; see bullets above for details', 'wp-reset') . '</li>';
    echo '<li>' . __('site title, WordPress address, site address, site language, search engine visibility and current user will be restored', 'wp-reset') . '</li>';
    echo '<li>' . __('you will be logged out, automatically logged in and taken to the admin dashboard', 'wp-reset') . '</li>';
    echo '<li>' . __('WP Reset plugin will be reactivated if that option is chosen in the <a href="#card-post-reset">post-reset options</a>', 'wp-reset') . '</li>';
    echo '</ul>';

    echo '<b>' . __('WP-CLI Support', 'wp-reset') . '</b>';
    echo '<p>' . sprintf(__('All features available via GUI are available in WP-CLI as well. To get the list of commands run %s. Instead of the active user, the first user with admin privileges found in the database will be restored.', 'wp-reset'), '<code>wp help reset</code>');
    echo sprintf(__('All actions have to be confirmed. If you want to skip confirmation use the standard %s option. Please be carefull - there is NO UNDO.', 'wp-reset'), '<code>--yes</code>') . '</p>';
    echo '</div>';

    $theme =  wp_get_theme();

    echo '<div class="card" id="card-post-reset">';
    echo '<a class="toggle-card" href="#" title="' . __('Collapse / expand box', 'wp-reset') . '"><span class="dashicons dashicons-arrow-up-alt2"></span></a>';
    echo '<h2>' . __('Post-reset actions', 'wp-reset') . '</h2>';
    echo '<p><label for="reactivate-theme"><input name="wpr-post-reset[reactivate_theme]" type="checkbox" id="reactivate-theme" value="1"> ' . __('Reactivate current theme', 'wp-reset') . ' - ' . $theme->get('Name') . '</label></p>';
    echo '<p><label for="reactivate-wpreset"><input name="wpr-post-reset[reactivate_wpreset]" type="checkbox" id="reactivate-wpreset" value="1" checked> ' . __('Reactivate WP Reset plugin', 'wp-reset') . '</label></p>';
    echo '<p><label for="reactivate-plugins"><input name="wpr-post-reset[reactivate_plugins]" type="checkbox" id="reactivate-plugins" value="1"> ' . __('Reactivate all currently active plugins', 'wp-reset') . '</label></p>';
    echo '</div>';

    echo '<div class="card">';
    echo '<h2>' . __('Reset', 'wp-reset') . '</h2>';
    echo '<p>' . __('Type <b>reset</b> in the confirmation field to confirm the reset and then click the "Reset WordPress" button. <b>There is NO UNDO. No backups are made by this plugin.</b>', 'wp-reset') . '</p>';
    
    wp_nonce_field('wp-reset');
    echo '<p><input id="wp_reset_confirm" type="text" name="wp_reset_confirm" placeholder="' . esc_attr__('Type in "reset"', 'wp-reset'). '" value="" autocomplete="off"> &nbsp;';
    echo '<input id="wp_reset_submit" type="button" class="button-primary" value="' . __('Reset WordPress', 'wp-reset') . '"></p>';
    echo '</div>';

    echo '<br><br>';
    echo '</form>';
    echo '</div>'; // wrap
  } // plugin_page
  
  
  /**
   * Helper function for generating UTM tagged links
   * 
   * @return string
   */
  function generate_web_link($placement = '', $page = '/', $params = array(), $anchor = '') {
    $base_url = 'https://wpreset.com';

    if ('/' != $page) {
      $page = '/' . trim($page, '/') . '/';
    }
    if ($page == '//') {
      $page = '/';
    }

    $parts = array_merge(array('utm_source' => 'wp-reset-free', 'utm_medium' => 'plugin', 'utm_content' => $placement, 'utm_campaign' => 'wp-reset-free-v' . $this->version), $params);

    if (!empty($anchor)) {
      $anchor = '#' . trim($anchor, '#');
    }

    $out = $base_url . $page . '?' . http_build_query($parts, '', '&amp;') . $anchor;

    return $out;
  } // generate_web_link


  /**
   * Clean up on uninstall; no action on deactive at the moment
   * 
   * @return null
   */
  static function uninstall() {
    delete_option('wp-reset');
  } // uninstall


  /**
   * Disabled; we use singleton pattern so magic functions need to be disabled
   * 
   * @return null
   */
  private function __clone() {}
  

  /**
   * Disabled; we use singleton pattern so magic functions need to be disabled
   * 
   * @return null
   */
  private function __sleep() {}


  /**
   * Disabled; we use singleton pattern so magic functions need to be disabled
   * 
   * @return null
   */
  private function __wakeup() {}
} // WP_Reset class


// Create plugin instance and hook things up
global $wp_reset;
$wp_reset = WP_Reset::getInstance();
add_action('plugins_loaded', array($wp_reset, 'load_textdomain'));
register_uninstall_hook(__FILE__, array('WP_Reset', 'uninstall'));
