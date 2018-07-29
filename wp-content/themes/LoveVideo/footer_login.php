<div id="content">
<div id="footer">
  <div class="bd clx">
    <?php $options = get_option('mfthemes_options');
			if( $options['footer']){?>
    <?php echo $options['footer'];?> Theme By <a href="http://www.adminbuy.cn/" title="模板王">模板王</a>
    <?php }else{?>
    <p>&copy; <?php echo date("Y");?> <a href="<?php bloginfo('url'); ?>" title="<?php bloginfo('name'); ?>">
      <?php bloginfo('name'); ?>
      </a> All Rights Reserved! </p>
    <p>Powered By WordPress, Theme By <a href="http://www.adminbuy.cn/wordpress/" title="wordpress模板">wordpress模板</a></p>
    <?php }?>
	<?php $options = get_option('mfthemes_options');
	if( $options['analysis']){?>
	<div id="analysis" style="display:none"><?php echo $options['analysis'];?></div>
	<?php }?>
  </div>
</div>
</div>
