<?php
/**
 * The template for displaying archive pages.
 *
 * @link https://codex.wordpress.org/Template_Hierarchy
 *
 * @package boke-1
 */

get_header(); ?>

	<div id="primary" class="content-area clear">

		<main id="main" class="site-main clear">

		<div id="recent-content" class="content-search">

			<div class="breadcrumbs clear">
				<h1>
				<?php 
					/* translators: %s: search term */
					printf( esc_html__( '"%s" 的搜索结果', 'boke-1' ), '<span>' . get_search_query() . '</span>' ); 
				?>	
				</h1>	
			</div><!-- .breadcrumbs -->
			<?php

			if ( have_posts() ) :	
						
			while ( have_posts() ) : the_post();

				get_template_part( 'template-parts/content', 'search' );

				endwhile;

				else :

					get_template_part( 'template-parts/content', 'none' );

				?>

			<?php endif; ?>

		</div>

		</main><!-- .site-main -->

		<?php get_template_part( 'template-parts/pagination', '' ); ?>

	</div><!-- #primary -->

<?php get_sidebar(); ?>
<?php get_footer(); ?>

