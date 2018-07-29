<div id="ft">
  <div class="pps-brim">
  	<div class="ft-inner">
    <dl class="cooperation">
     <dt class="dt">合作伙伴</dt>
	      <dd class="dd"> 	
	 <?php wp_list_bookmarks('title_li=&categorize=0&limit=10'); ?>
	  <a href="/links/" target="_blank">更多&gt;&gt;</a>
	 </dd>
    </dl>
    <dl class="pps-news">
     <dt class="dt">投稿最新文章</dt>
	  	 	
     <?php $posts = get_posts( "category_name=tougao&numberposts=4" ); ?>
<?php if( $posts ) : ?>
<?php foreach( $posts as $post ) : setup_postdata( $post ); ?>						
<dd class="dd">
<a href="<?php the_permalink() ?>" target="_blank" title="<?php the_title(); ?>"><?php the_title(); ?></a>
	 </dd>
	 
						<?php endforeach; ?>
						<?php endif; ?>
	     </dl>
	<dl class="pps-soft">
		<dt class="dt">其他</dt>
		<?php $posts = get_posts( "category_name=muhou&numberposts=4" ); ?>
<?php if( $posts ) : ?>
<?php foreach( $posts as $post ) : setup_postdata( $post ); ?>						
<dd class="dd">
<a href="<?php the_permalink() ?>" target="_blank" title="<?php the_title(); ?>"><?php the_title(); ?></a>
	 </dd>
	 <?php endforeach; ?>
						<?php endif; ?>
	</dl>
				<?php
	$options = get_option('mfthemes_options');
	if( $options['tsina']);
?>
	<dl class="pps-follow">
		<dt class="dt">联系我们</dt>
		<dd class="dd">Q  Q:9490489</dd>
		<dd class="dd">电话:020-28937275</dd>	
	</dl>
   </div>
  </div>
		<div class="pps-ft">
    <p class="menu"><?php 
	$menuParameters = array(
	    'theme_location'=>'primary2',
		'container'	=> false,
		'echo'	=> false,
		'items_wrap' => '%3$s',
		'depth'	=> 0,
	    );
	   echo strip_tags(wp_nav_menu( $menuParameters ), '<a>' );
                    ?></p>
    <p class="cert">
	<?php $options = get_option('mfthemes_options');
			if( $options['footer']){?>
				<?php echo $options['footer'];?> Theme By <a href="http://www.adminbuy.cn/" title="模板王">模板王</a>
			<?php }else{?>
				<p>&copy; <?php echo date("Y");?> <a href="<?php bloginfo('url'); ?>" title="<?php bloginfo('name'); ?>"><?php bloginfo('name'); ?></a> All Rights Reserved! </p>
				<p>Powered By WordPress, Theme By <a href="http://www.adminbuy.cn/wordpress/" title="wordpress模板">wordpress模板</a></p>
			<?php }?></p>
    <span class="pps-slogan">还好有你!</span>
  </div>
</div>
<script type="text/javascript">require(['list/main'], function(){});</script>
<?php $options = get_option('mfthemes_options');
	if( $options['analysis']){?>
	<div id="analysis" style="display:none"><?php echo $options['analysis'];?></div>
	<?php }?>
</body></html>