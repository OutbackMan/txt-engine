import F_Config from "./Config.js";
import * as F_Common from "./Common.js";

export default class TextCtx {
  constructor(canvas_dom_elem, logical_width, logical_height) {
    this._ctx = canvas_dom_elem.getContext("2d");
    this._reset_font();

    this._ch_width = parseFloat(this._ctx.measureText("M").width);
    this._ch_height = parseFloat(this._get_ch_height());

    this._logical_width = logical_width;
    this._logical_height = logical_height;
    this._min_canvas_width = parseInt(this._logical_width * this._ch_width, 10);
    this._min_canvas_height = parseInt(this._logical_height * this._ch_height, 10);

	this._ch_buffer = new Array(logical_width * logical_height);

    this._scale_to_current_window_dimensions();

    window.addEventListener("resize", (e) => {
      this._scale_to_current_window_dimensions();
    });
    window.addEventListener("orientationchange", (e) => {
      this._scale_to_current_window_dimensions();
    });
  }

  _reset_font() {
    this._ctx.font = "normal 2px monospace";
    this._ctx.textBaseline = "hanging";
    this._ctx.textAlign = "left";
  }

  _get_ch_height() {
    let text_span_elem = document.createElement("span");
    text_span_elem.style = "font: normal 2px monospace;";
    let span_text = document.createTextNode("Hg");
    text_span_elem.appendChild(span_text);

    let moveable_div_elem = document.createElement("div");
    moveable_div_elem.style = "display: inline-block; width: 1px; height: 0px;";

    let wrapper_div_elem = document.createElement("div");
    wrapper_div_elem.appendChild(text_span_elem);
    wrapper_div_elem.appendChild(moveable_div_elem);

    document.body.appendChild(wrapper_div_elem);

    moveable_div_elem.style.verticalAlign = "bottom";
    let ch_height = moveable_div_elem.getBoundingClientRect().top - text_span_elem.getBoundingClientRect().top;

    document.body.removeChild(wrapper_div_elem);

    return ch_height;
  }

  _scale_to_current_window_dimensions() {
    if (window.innerWidth < this._min_canvas_width) {
      this._ctx.canvas.width = this._min_canvas_width; 
    } else {
      this._ctx.canvas.width = window.innerWidth;
    }
    if (window.innerHeight < this._min_canvas_height) {
      this._ctx.canvas.height = this._min_canvas_height; 
    } else {
      this._ctx.canvas.height = window.innerHeight;
    }
    
    this._reset_font();
    
    const NUM_CH_COULD_BE_DISPLAYED_X = parseInt(this._ctx.canvas.width / this._ch_width, 10);
    const NUM_CH_COULD_BE_DISPLAYED_Y = parseInt(this._ctx.canvas.height / this._ch_height, 10);

    this._x_scale = NUM_CH_COULD_BE_DISPLAYED_X / this._logical_width;
    this._y_scale = NUM_CH_COULD_BE_DISPLAYED_Y / this._logical_height;

    this._ctx.scale(this._x_scale, this._y_scale);
  }

  set_ch(x, y, glyph, color) {
    if (x < 0) {
	  F_Common.debug_breakpoint(`Invalid coordinates (${x}, ${y}): x must be >= 0`);	
	  x = 0; 
	} 
	if (x >= this._logical_width) {
	  F_Common.debug_breakpoint(`Invalid coordinates (${x}, ${y}): x must be < ${this._logical_width}`);	
	  x = this._logical_width - 1;
	} 
	if (y < 0) {
	  F_Common.debug_breakpoint(`Invalid coordinates (${x}, ${y}): y must be >= 0`);	
	  y = 0;
	} 
	if (y >= this._logical_height) {
	  F_Common.debug_breakpoint(`Invalid coordinates (${x}, ${y}): y must be < ${this._logical_height}`);	
	  y = this._logical_height - 1;
	} 

    this._ch_buffer[y * this._logical_width + x] = new _Ch(glyph, color);	  
  }

  set_str(x, y, str, color) {
    if (x + str.length - 1 >= this._logical_width) {
	  F_Common.debug_breakpoint(`Text "${text}" drawn at (${x}, ${y}) exceeds canvas width`);
	  // canvas cuts off text by default
    }

    for (let ch_index = 0; ch_index < str.length; ++ch_index) {
      this.set_ch(x + ch_index, y, str[ch_index], color);
	}
  }

  render() {
    this._ctx.clearRect(0, 0, this._ctx.canvas.width, this._ctx.canvas.height); 

    for (let row = 0; row < this._logical_height; ++row) {                            
      let row_gradient = this._ctx.createLinearGradient(0, row, this._logical_width, row);       
      let gradient_stop = 0.0;                                                            
      let gradient_stop_inc = 1 / this._logical_width;               
      let row_str = "";                                                             

      for (let col = 0; col < this._logical_width; ++col) {                           
        let [ch_glyph, ch_color] = Object.values(this._ch_buffer[row * this._logical_width + col]);
                                                                                    
        row_gradient.addColorStop(gradient_stop, ch_color);                             
        row_gradient.addColorStop(gradient_stop + gradient_stop_inc, ch_color);

        gradient_stop += gradient_stop_inc;                                                      
        row_str += ch_glyph;                                                      
      }                                                                             
                                                                                
      this._ctx.fillStyle = row_gradient;
      this._ctx.fillText(row_str, 0, parseInt(row * this._ch_height));
    }                                       
  }

}

// Object.create(null) more memory efficient
class _Ch {                                                                    
  constructor(glyph, color) {                                                   
    this.glyph = glyph;                                                         
    this.color = color;                                                         
  }                                                                             
}                                                                               
