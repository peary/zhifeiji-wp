<?php
/**
 * The template for displaying the footer.
 *
 * Contains the closing of the #content div and all content after.
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package boke-1
 */

?>

	</div><!-- #content .site-content -->
	
	<footer id="colophon" class="site-footer">

		<?php if ( is_active_sidebar( 'footer-1' ) || is_active_sidebar( 'footer-2' ) || is_active_sidebar( 'footer-3' ) || is_active_sidebar( 'footer-4' ) ) { ?>

			<div class="footer-columns clear">

				<div class="container clear">

					<div class="footer-column footer-column-1">
						<?php dynamic_sidebar( 'footer-1' ); ?>
					</div>

					<div class="footer-column footer-column-2">
						<?php dynamic_sidebar( 'footer-2' ); ?>
					</div>

					<div class="footer-column footer-column-3">
						<?php dynamic_sidebar( 'footer-3' ); ?>
					</div>

					<div class="footer-column footer-column-4">
						<?php dynamic_sidebar( 'footer-4' ); ?>
					</div>												

				</div><!-- .container -->

			</div><!-- .footer-columns -->

		<?php } ?>

		<div class="clear"></div>

		<div id="site-bottom" class="clear">

			<div class="container">

			<div class="site-info">

				<?php
					$author_uri = 'http://www.zhutibaba.com/';
				?>

				&copy; <?php echo date("Y"); ?> <a href="<?php echo esc_url( home_url() ); ?>"><?php bloginfo('name'); ?></a>

			</div><!-- .site-info -->

			<?php 
				if ( has_nav_menu( 'footer' ) ) {
					wp_nav_menu( array( 'theme_location' => 'footer', 'menu_id' => 'footer-menu', 'menu_class' => 'footer-nav' ) );
				}
			?>	

			</div><!-- .container -->

		</div>
		<!-- #site-bottom -->
							
	</footer><!-- #colophon -->
</div><!-- #page -->

<div id="back-top">
	<a href="#top" title="<?php echo __('返回顶部', 'boke-1'); ?>"><span class="genericon genericon-collapse"></span></a>
</div>

<?php wp_footer(); ?>

<script>
var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?11e1fcf8c087695ab66673652234e853";
  var s = document.getElementsByTagName("script")[0]; 
  s.parentNode.insertBefore(hm, s);
})();
</script>

</body>
</html>
