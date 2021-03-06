let filter_criteria = {
  'low_price': 804,
  'high_price': 3964,
  'low_year': 1817,
  'high_year': 2013,
  'type': ["SingleFamily", "MultiFamily2To4", "Condominium", "Townhouse"]
};

function mouse_over_event(d){
  d.target.setRadius(15);

  d3.selectAll('.circle_plots')
  .transition()
  .duration(1000)
  .attr('fill', 'blue')
  .attr('stroke-opacity', 0);
}

function mouse_out_event(d){
  d.target.setRadius(8);
}

function mouse_over_event(d){
  d.target.setRadius(15);
}

function show_search_result(res){
  var plots = d3.selectAll('.circle_plots').data(res);
  plots.exit().remove();
  plots.transition()
  .duration(500)
  .attr('fill-opacity', function(d){
    return d.show ? 0.9 : 0.4;
  })
  .attr('fill', function(d){
    return d.show ? '#ff7800' : 'grey';
  });
}

function update_filtering(data){
  d3.select('.price_filter')
  .text('Price: $' + filter_criteria.low_price + ' - $' + filter_criteria.high_price);

  d3.select('.year_filter')
  .text('Year: ' + filter_criteria.low_year + ' - ' + filter_criteria.high_year);

  d3.select('.type_filter')
  .text('House Type: ' + filter_criteria.type.join(', '))


  data.forEach(function(d){
    d.show = (Number(d['Rent Amount'])<= filter_criteria.high_price && Number(d['Rent Amount']) >= filter_criteria.low_price);
    d.show = d.show && (filter_criteria.type.includes(d['Property Type']));
    d.show = d.show && (Number(d['Year Built'])<= filter_criteria.high_year && Number(d['Year Built']) >= filter_criteria.low_year);
    return d;
  });
  return data;
}

function filter_by_prices(data,low,high){
  var low = filter_criteria.low_price;
  var high = filter_criteria.high_price;

  data.forEach(function(d){
    d.show = (Number(d['Rent Amount'])<= high && Number(d['Rent Amount']) >= low);
    return d;
  });
  return data;
}

function filter_by_neighborhood(data, neighborhood) {
  let result = data.filter(function(d) {
    return d.Neighborhood === String(neighborhood);
  })
  return result;
}

function filter_by_home_type(data, home_type_lst) {
  var home_type_lst = filter_criteria.type;
  data.forEach(function(d){
    d.show = (home_type_lst.includes(d['Property Type']));
    return d;
  });
  return data;
}

function filter_by_year_built(data,low,high){
  var low = filter_criteria.low_year;
  var high = filter_criteria.high_year;
  data.forEach(function(d){
    d.show = (Number(d['Year Built'])<= high && Number(d['Year Built']) >= low);
    return d;
  });
  return data;
}

let plot_hist = function(data, map) {
  var PADDING = 20;
  var height = 250;
  var width = 450;
  // show div
  document.getElementById('house_style').style.display = "none";
  d3.select('#house_style').select('.content').remove();

  document.getElementById('hist_year').style.display = "none";
  d3.select('.svg_year').select('.content').remove();

  document.getElementById('hist_price').style.display = "block";
  d3.select('#hist_price').select('.content').remove();


  var g = d3.select('.svg_price')
  .append('g')
  .attr('class', 'content')
  .attr('transform', 'translate('+PADDING+','+PADDING+')');

  g.append('text')
  .attr('transform', 'translate('+(width/2)+','+(PADDING/2)+')')
  .attr('text-anchor', 'middle')
  .attr('class', 'price_range')

  var price = data.map(d=>Number(d['Rent Amount']));

  var formatCount = d3.format(",.0f");

  var x = d3.scaleLinear()
    .domain(d3.extent(price))
    .rangeRound([PADDING, width-2*PADDING]);

  var fixed_x = d3.scaleLinear()
    .domain(d3.extent(price))
    .rangeRound([PADDING, width-2*PADDING]);

  var bins = d3.histogram()
      .domain(x.domain())
      .thresholds(x.ticks(15))
      (price);

  var y = d3.scaleLinear()
      .domain([0, d3.max(bins, function(d) { return d.length; })])
      .range([height-PADDING, PADDING]);

  var bar = g.selectAll(".bar")
    .data(bins)
    .enter().append("g")
      .attr("class", "bar")
      .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; });

  bar.append("rect")
      .attr("x", 1)
      .attr("width", x(bins[0].x1) - x(bins[0].x0) - 1)
      .attr("height", function(d) {return height-PADDING-y(d.length); })
      .attr("fill", "steelblue");

    var brush = d3.brushX()
        .extent([[PADDING, PADDING], [width-PADDING, height-PADDING]])
        .on("brush end", brushed);

    function brushed() {
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
      var s = d3.event.selection || x.range();
      x.domain(s.map(x.invert, x));

      var low = parseInt(fixed_x.invert(s[0]));
      var high = parseInt(fixed_x.invert(s[1]));

      filter_criteria.low_price = low;
      filter_criteria.high_price = high;

      var res = update_filtering(data);
      show_search_result(res);

      g.select('.price_range')
      .text('$'+low + ' - $' + high)
    }

    g.append("g")
       .attr("class", "brush")
       .call(brush)
       .call(brush.move, x.range());

  bar.append("text")
      .attr("dy", ".75em")
      .attr("y", 6)
      .attr("x", (x(bins[0].x1) - x(bins[0].x0)) / 2)
      .attr("text-anchor", "middle")
      .attr("font", "sans-serif")
      .attr("font-size", "8px")
      .attr("fill", "#fff")
      .text(function(d) {
        if ((d.length) > 20){
          return formatCount(d.length);
        }
      });

  g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + (height-PADDING) + ")")
      .call(d3.axisBottom(x));

  d3.select('.axis').selectAll('.tick')
  .attr("font-size", "6px");

  g.append('text')
  .attr('x', width-2*PADDING)
  .attr('y', height+PADDING*.8)
  .style('text-anchor', 'middle')
  .text('Close')
  .attr('font-size', '12px')
  .attr('fill', 'black')
  .on('mouseover', function(d){
    d3.select(this).transition().duration(300)
    .attr('font-size', '15px')
    .attr('fill', 'pink')
  })
  .on('mouseout', function(d){
    d3.select(this).style("cursor", "pointer")
    .transition().duration(300)
    .attr('font-size', '12px')
    .attr('fill', 'black')
  })
  .on('click', function(d){
    document.getElementById('hist_price').style.display = "none";
  });
}

let plot_hist_year = function(data, map) {
  var PADDING = 20;
  var height = 250;
  var width = 450;
  // show div
  document.getElementById('house_style').style.display = "none";
  d3.select('#house_style').select('.content').remove();

  document.getElementById('hist_price').style.display = "none";
  d3.select('#hist_price').select('.content').remove();

  document.getElementById('hist_year').style.display = "block";
  d3.select('.svg_year').select('.content').remove();

  var g = d3.select('.svg_year')
  .append('g')
  .attr('class', 'content')
  .attr('transform', 'translate('+PADDING+','+PADDING+')');

  g.append('text')
  .attr('transform', 'translate('+(width/2)+','+(PADDING/2)+')')
  .attr('text-anchor', 'middle')
  .attr('class', 'price_range')

  var year = data.map(d=>Number(d['Year Built']));
  var year_data = {};

  year.forEach(function(y){
    if (year_data.hasOwnProperty(y)){
      year_data[y]+=1;
    }
    else{
      year_data[y]=1
    }
  });

  var ts_data = [];
  for (var k in year_data) {
        if (year_data.hasOwnProperty(k)) {
           ts_data.push({"year":Number(k), "freq":year_data[k]});
        }
  };
  ts_data.sort(function(a,b){return a.year-b.year});


  var formatCount = d3.format(",.0f");

  var x = d3.scaleLinear()
    .domain(d3.extent(ts_data, d=>d.year))
    .rangeRound([PADDING, width-2*PADDING]);

  var fixed_x = d3.scaleLinear()
    .domain(d3.extent(ts_data, d=>d.year))
    .rangeRound([PADDING, width-2*PADDING]);

  var y = d3.scaleLinear()
      .domain([0, d3.max(ts_data, d=>d.freq)])
      .range([height-PADDING, PADDING]);

  // define the line
  var valueline = d3.line()
      .x(function(d) { return x(d.year); })
      .y(function(d) { return y(d.freq); })
      .curve(d3.curveMonotoneX);

  // Add the valueline path.
  g.append("path")
      .data([ts_data])
      .attr("class", "line")
      .attr("d", valueline)
      .attr("fill", "none")
      .style('stroke-width', '2px')
      .style("stroke", "steelblue");

    var brush = d3.brushX()
        .extent([[PADDING, PADDING], [width-2*PADDING, height-PADDING]])
        .on("brush end", brushed);

    function brushed() {
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
      var s = d3.event.selection || x.range();
      x.domain(s.map(x.invert, x));

      var low = parseInt(fixed_x.invert(s[0]));
      var high = parseInt(fixed_x.invert(s[1]));

      filter_criteria.low_year = low;
      filter_criteria.high_year = high;

      var res = update_filtering(data);
      show_search_result(res);

      g.select('.price_range')
      .text(''+low + ' - ' + high)
    }

  g.append("g")
     .attr("class", "brush")
     .call(brush)
     .call(brush.move, x.range());

  g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + (height-PADDING) + ")")
      .call(d3.axisBottom(x));

  d3.select('.axis').selectAll('.tick')
  .attr("font-size", "6px");

  g.append('text')
  .attr('x', width-2*PADDING)
  .attr('y', height+PADDING*.8)
  .style('text-anchor', 'middle')
  .text('Close')
  .attr('font-size', '12px')
  .attr('fill', 'black')
  .on('mouseover', function(d){
    d3.select(this).transition().duration(300)
    .attr('font-size', '15px')
    .attr('fill', 'pink')
  })
  .on('mouseout', function(d){
    d3.select(this).style("cursor", "pointer")
    .transition().duration(300)
    .attr('font-size', '12px')
    .attr('fill', 'black')
  })
  .on('click', function(d){
    document.getElementById('hist_year').style.display = "none";
  });
}



let house_style_filter = function(data, map) {
  let selected = filter_criteria.type;
  var PADDING = 20;
  var height = 250;
  var width = 450;
  // show div

  document.getElementById('hist_price').style.display = "none";
  d3.select('#hist_price').select('.content').remove();

  document.getElementById('hist_year').style.display = "none";
  d3.select('.svg_year').select('.content').remove();

  document.getElementById('house_style').style.display = "block";
  d3.select('.svg_style').select('.content').remove();

  var g = d3.select('.svg_style')
  .append('g')
  .attr('class', 'content')
  .attr('transform', 'translate('+PADDING+','+PADDING+')');

  var y = d3.scaleLinear().domain([0,3]).range([height-PADDING, PADDING]);

  var house_style_list = ["SingleFamily", "MultiFamily2To4", "Condominium", "Townhouse"];

  g.selectAll('.clickable_rect')
  .data([0,1,2,3])
  .enter()
  .append('rect')
  .attr('x', PADDING*6)
  .attr('y', d=>y(d))
  .attr('width', 20)
  .attr('height', 20)
  .attr('fill', 'steelblue')
  .attr('stroke', 'steelblue')
  .on('click', function(d, i){
    var clicked = d3.select(this).attr('fill') == 'steelblue';
    if (clicked){
      d3.select(this).attr('fill', 'white');
      var index = selected.indexOf(house_style_list[i]);
      if (index > -1) {
        selected.splice(index, 1);
      }
    }
    else{
      d3.select(this).attr('fill', 'steelblue');
      if (!selected.includes(house_style_list[i])){
        selected.push(house_style_list[i]);
      }
    }
    var res = update_filtering(data);
    show_search_result(res);
  })
  .on('mouseover', function(){
    d3.select(this).style("cursor", "pointer");
  });

  g.selectAll('.clickable_rect')
  .data(["Single Family","MultiFamily (2-4)", "Condominium", "Townhouse"])
  .enter()
  .append('text')
  .style('alignment-baseline', 'middle')
  .attr('x', PADDING*9)
  .attr('y', (d, i)=>y(i)+10)
  .text(d=>d);



  g.append('text')
  .attr('x', width-2*PADDING)
  .attr('y', height+PADDING*.8)
  .style('text-anchor', 'middle')
  .text('Close')
  .attr('font-size', '12px')
  .attr('fill', 'black')
  .on('mouseover', function(d){
    d3.select(this).transition().duration(300)
    .attr('font-size', '15px')
    .attr('fill', 'pink')
  })
  .on('mouseout', function(d){
    d3.select(this).style("cursor", "pointer")
    .transition().duration(300)
    .attr('font-size', '12px')
    .attr('fill', 'black')
  })
  .on('click', function(d){
    document.getElementById('house_style').style.display = "none";
  });
}
