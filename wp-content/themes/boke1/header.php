<?php
/**
 * The header for our theme.
 *
 * This is the template that displays all of the <head> section and everything up until <div id="content">
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package boke-1
 */

?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="HandheldFriendly" content="true">
<link rel="profile" href="http://gmpg.org/xfn/11">
<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<div id="page" class="site">

	<header id="masthead" class="site-header clear">
		<?php
			the_custom_header_markup();
		?>
		<div class="container">

		<div class="site-branding">

			<?php if (has_custom_logo()) { ?>

				<div id="logo">
					<span class="helper"></span>
					<?php the_custom_logo(); ?>
				</div><!-- #logo -->

			<?php } else { ?>

				<div class="site-title">
					<h1><a href="<?php echo esc_url( home_url() ); ?>"><?php bloginfo('name'); ?></a></h1>
				</div><!-- .site-title -->

			<?php } ?>

		</div><!-- .site-branding -->		

		<nav id="primary-nav" class="primary-navigation">
			<?php 
				wp_nav_menu( array( 'theme_location' => 'primary', 'menu_id' => 'primary-menu', 'menu_class' => 'sf-menu' ) );
			?>
		</nav><!-- #primary-nav -->

		<div id="slick-mobile-menu"></div>
			
		<span class="search-icon">
			<span class="genericon genericon-search"> <span><?php esc_html_e('搜索', 'boke-1'); ?></span></span>
			<span class="genericon genericon-close"> <span><?php esc_html_e('收起', 'boke-1'); ?></span></span>			
		</span>

		<div class="header-search">
			<?php get_search_form(); ?>
		</div><!-- .header-search -->

		</div><!-- .container -->

	</header><!-- #masthead -->	

<div id="content" class="site-content container clear">
