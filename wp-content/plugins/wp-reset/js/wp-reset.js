/**
 * WP Reset
 * https://wpreset.com/
 * (c) WebFactory Ltd, 2017-2018
 */


jQuery(document).ready(function($) {
  $('#wp_reset_form').on('submit', function(e, confirmed) {
    if (!confirmed) {
      $('#wp_reset_submit').trigger('click');
      e.preventDefault();
      return false;
    }

    $(this).off('submit').submit();
    return true;
  }); // bypass default submit behaviour


  $('#wp_reset_submit').click(function(e) {
    if ($('#wp_reset_confirm').val() !== 'reset') {
      swal({ title: wp_reset.invalid_confirmation_title,
             text: wp_reset.invalid_confirmation,
             type: 'error',
             confirmButtonText: wp_reset.ok_button,
      });
      
      e.preventDefault();
      return false;
    } // wrong confirmation code

    message = wp_reset.confirm1 + '<br>' + wp_reset.confirm2;
    swal({ title: wp_reset.confirm_title,
           type: 'question',
           html: message,
           showCancelButton: true,
           focusConfirm: false,
           confirmButtonText: wp_reset.confirm_button,
           cancelButtonText: wp_reset.cancel_button,
           confirmButtonColor: '#dd3036',
           width: 600
    }).then((result) => {
      if (result.value === true) {
        swal({ text: wp_reset.doing_reset,
               type: false,
               imageUrl: wp_reset.icon_url,
               onOpen: () => { $(swal.getImage()).addClass('rotating'); },
               imageWidth: 100,
               imageHeight: 100,
               imageAlt: wp_reset.doing_reset,
               allowOutsideClick: false,
               allowEscapeKey: false,
               allowEnterKey: false,
               showConfirmButton: false,
        });
        $('#wp_reset_form').trigger('submit', true);
      }
    });

    e.preventDefault();
    return false;
  }); // reset submit


  // collapse / expand card
  $('.card').on('click', '.toggle-card', function(e) {
    e.preventDefault();

    card = $(this).parents('.card').toggleClass('collapsed');
    $('.dashicons', this).toggleClass('dashicons-arrow-up-alt2').toggleClass('dashicons-arrow-down-alt2');
    $(this).blur();

    cards = localStorage.getItem('wp-reset-cards');
    if (cards == null) {
      cards = new Object();
    } else {
      cards = JSON.parse(cards);
    }

    if (card.hasClass('collapsed')) {
      cards[card.attr('id')] = 'collapsed';
    } else {
      cards[card.attr('id')] = 'expanded';
    }
    localStorage.setItem('wp-reset-cards', JSON.stringify(cards));

    return false;
  }); // toggle-card

  
  // init cards; collapse those that need collapsing
  cards = localStorage.getItem('wp-reset-cards');
  if (cards != null) {
    cards = JSON.parse(cards);
  }
  $.each(cards, function(card_name, card_value) {
    if (card_value == 'collapsed') {
      $('a.toggle-card', '#' + card_name).trigger('click');
    }
  });

  
  // dismiss notice / pointer
  $('.wpr-dismiss-notice').on('click', function(e) {
    notice_name = $(this).data('notice');
    if (!notice_name) {
      return true;
    }

    $.get(ajaxurl, { notice_name: notice_name,
                     _ajax_nonce: wp_reset.nonce_dismiss_notice,
                     action: 'wp_reset_dismiss_notice'
    });

    $(this).parents('.notice-wrapper').fadeOut();

    e.preventDefault();
    return false;
  }); // dismiss notice
}); // onload
