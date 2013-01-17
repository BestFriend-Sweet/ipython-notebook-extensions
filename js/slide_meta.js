var tminus  = 340
var deltat  = 140
var tplus   = tminus+deltat

var bind_remote = function(selector){
    var cc = $('<input/>')
        .attr('id','azerty')
        .fadeTo(0.2,0)
        .keydown(
        function(event){
                if(event.which == IPython.utils.keycodes.LEFT_ARROW){
                    console.log('go left');
                    IPython.slideshow.prev();
                }
                else if(event.which == IPython.utils.keycodes.RIGHT_ARROW){
                    console.log('go right')
                    IPython.slideshow.next();
                }
            event.preventDefault();
            return false;
            })
            .focusin(function(){$('#qwerty').button('option','label','Slide Mode Enabled')})
            .focusout(function(){$('#qwerty').button('option','label','Enable Slide Mode')})

        var dd = $('<div/>')
            .attr('id','qwerty')
            .button({label:'slide control'})
            .attr('style','float:right')
            .click(
                function(){
                    $('#azerty').focus();
                    console.log('...');
                })
            .keydown(
                function(event){
                    console.log('event append',event);
                event.preventDefault();
                return false;
                })
    var hin = function(){$(selector).fadeTo('slow',1);}
    var hout= function(){$(selector).fadeTo('slow',0.3);}
    $(selector)
        .append(cc)
        .append(dd)
        .fadeTo('slow',0.3)
    .hover(hin,hout)

}

var show_line = function(cell,line_number){
    cell.code_mirror.showLine(cell.code_mirror.getLineHandle(line_number-1))
}

IPython = (function(IPython) {
    var Presentation = function(){
          this.ccell = 0;
    }

    var is_marked_cell = function(cell){
        var def = { "slideshow": {} }
        m = cell.metadata.slideshow ? cell.metadata.slideshow:{}
        return ( m.slide_type == 'slide')
    }

    var is_cell_of_type = function(cell,type){
        if (cell == undefined){ 
            return false 
        }
        var def = { "slideshow": {} }
        m = cell.metadata.slideshow ? cell.metadata.slideshow:{}
        return ( m.slide_type == type)
    }

    var _typer = function(type){
        return function(cell){return is_cell_of_type(cell,type)}
    }

    var is_undefined = _typer(undefined)
    var is_fragment = _typer('fragment')
    var is_slide = _typer('slide')
    var is_skip = _typer('skip')
    var is_sub_slide = _typer('sub_slide')
    var is_notes = _typer('notes')

    Presentation.prototype.create_toolbar = function(){
        var pt = $('<div/>').attr('id','toolbar_present').addClass('toolbar');
        var that = this;
        this.avc = $('<div/>').button({label:that.eta()});
        pt.append(this.avc);

        $('#maintoolbar').after(pt);
        var ptoolbar = new IPython.ToolBar('#toolbar_present');
        IPython.ptoolbar = ptoolbar;
        ptoolbar.add_buttons_group([{label:'Stop', icon:'ui-icon-pause', callback:function(){that.pause()}}])
        ptoolbar.add_buttons_group([{label:'Stop', icon:'ui-icon-stop', callback:function(){that.stop()}}])
        ptoolbar.add_buttons_group([
                 {label:'Prev Slide', icon:'ui-icon-seek-prev', callback:function(){that.prev_group()}},
                 {label:'Next Slide', icon:'ui-icon-seek-next', callback:function(){that.next_group()}},
                                ])
        ptoolbar.add_buttons_group([
                 {label:'Step Next', icon:'ui-icon-play', callback:function(){that.next()}}
                 ])

        bind_remote('#toolbar_present');

    }

      Presentation.prototype.remove_toolbar = function(){
          $('#toolbar_present').remove();
      }

      Presentation.prototype.ngroups = function(){
          var cells = IPython.notebook.get_cells();
          var cnt =0
          for( var i=0; i< cells.length;i++)
              if(is_marked_cell(cells[i])) cnt++;
          return cnt
      }

      Presentation.prototype.cgroups = function(){
          var cells = IPython.notebook.get_cells();
          var cnt =0
          for( var i=0; i<= this.ccell ;i++)
              if(is_marked_cell(cells[i])) cnt++;
          return cnt
      }

      Presentation.prototype.eta = function(){
          return this.cgroups()+'/'+this.ngroups()
          }

      Presentation.prototype.next_marked_cell_n = function()
      {
          for(var i=this.ccell+1; i< $('.cell').length; i++)
          {
              if(is_marked_cell(IPython.notebook.get_cell(i)))
                { return i; }
          }
          return null;
      }

      Presentation.prototype.prev_marked_cell_n = function()
      {
          for(var i=this.ccell-1; i> 0; i--)
          {
              if(is_marked_cell(IPython.notebook.get_cell(i))){
                 return i
              }
          }
          return 0;
      }

      Presentation.prototype.start = function(){
          this.restart();
          this.resume();
      }

      Presentation.prototype.restart = function(){
          this.ccell = 0;
          delete this.avc;
      }

      Presentation.prototype.resume = function(){
          this.create_toolbar();
          $('#menubar').addClass('pmode');
          $('#pager_splitter').addClass('pmode');
          $('#pager').addClass('pmode');
          $('#menubar, #pager_splitter, #pager, #header,#maintoolbar').addClass('pmode');
          $('#header').addClass('pmode');
          $('#maintoolbar').addClass('pmode');
          $('div#header').css('display','none');
          IPython.layout_manager.do_resize();
          $('.cell').fadeOut(tminus);
          if(this.current_is_marked()){
              $('.cell:nth('+this.ccell+')').fadeIn();
          } else {
              for( var i=this.prev_marked_cell_n() ; i<= this.ccell; i++){
                  $('.cell:nth('+i+')').fadeIn();
              }
          }
          var that=this;
          if(this.avc != undefined)
            $(this.avc).button('option','label',that.eta())
          return this;
      }

      Presentation.prototype.stop = function(){
              this.restart();
              this.pause();
      }

      Presentation.prototype.pause = function(){
          $('.cell').fadeIn();
          $('.pmode').removeClass('pmode');
          $('div#header').css('display','block');
          $('div#notebook').removeClass('pmode');
          IPython.layout_manager.do_resize();
          this.remove_toolbar();
      }

      Presentation.prototype.next = function(){
          var current_cell_number = this.ccell
          var number_next_cell = this.ccell+1
          this.ccell = this.ccell+1

          var that = this;
          if(this.ccell >= $('.cell').length ){
              this.stop();
              return;
          }
          var next_cell = IPython.notebook.get_cell(number_next_cell)
          var look_ahead_cell = IPython.notebook.get_cell(number_next_cell+1)

          if(is_marked_cell(next_cell)){
              $('.cell').fadeOut(tminus);
              setTimeout(function(){$('.cell:nth('+number_next_cell+')').fadeIn(tminus)},tplus);
          } else {
              if( !is_skip(next_cell) && !is_notes(next_cell) ){
                setTimeout(function(){$('.cell:nth('+number_next_cell+')').fadeIn(tminus)},tplus);
              }
          }
          $(this.avc).button('option','label',that.eta())
            
          if(is_undefined(look_ahead_cell) || is_skip(look_ahead_cell) || is_notes(look_ahead_cell)){
              this.next()
          }
      }

      Presentation.prototype.next_group = function(){
          this.ccell = this.next_marked_cell_n();
          var that = this;
          $('.cell').fadeOut(tminus);
          setTimeout(function(){
              $('.cell:nth('+that.ccell+')').fadeIn(tminus)
                  },tplus);
          $(this.avc).button('option','label',that.eta())
      }

      Presentation.prototype.prev_group = function(){
          this.ccell = this.prev_marked_cell_n();
          var that = this
          $('.cell').fadeOut(tminus);
          setTimeout(function(){$('.cell:nth('+that.ccell+')').fadeIn(tminus)},tplus);
          $(this.avc).button('option','label',that.eta())
      }

      Presentation.prototype.is_n_marked = function(n){
          return is_marked_cell(IPython.notebook.get_cell(n))
      }

      Presentation.prototype.current_is_marked = function(n){
          return is_marked_cell(IPython.notebook.get_cell(this.ccell));
      }

      Presentation.prototype.prev = function(){
          if(is_marked_cell(IPython.notebook.get_cell(this.ccell))){
              var pmcell = this.prev_marked_cell_n();
              $('.cell').fadeOut(tminus);
              for( var i=pmcell; i< this.ccell ; i++ ){
                  (function(val){
                      return function(){
                                  setTimeout( function(){
                                      $('.cell:nth('+val+')').fadeIn(tminus)
                                      },tplus);
                      }
                   })(i)();
              }
          } else {
              $('.cell:nth('+this.ccell+')').fadeOut(tminus);
          }
          this.ccell = this.ccell -1;
          return this;
      }

      IPython.Presentation = Presentation;
      return IPython;

})(IPython);

//$('body').append($('<style/>').text('.pmode{ display: none !important }'));
//
IPython.slideshow = new IPython.Presentation();

    var sid = 'start_pmode'
    if(($('#'+sid)).length == 0) {
          IPython.toolbar.add_buttons_group([
                  {'label'  :'Start Slideshow',
                    'icon'  :'ui-icon-image',
                    'callback':function(){IPython.slideshow.resume()},'id':sid},
              ])
         }
