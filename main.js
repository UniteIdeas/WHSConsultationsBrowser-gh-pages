"use strict";
window.onload = function() {

    // Animate preloader
    var preloader = 0,
        interval = setInterval(function(a) {
            d3.selectAll('#intro td').classed('active', false);
            d3.select(d3.selectAll('#intro td')[0][preloader % 5]).classed('active', true);
            preloader += 1;
        }, 400);

    // Functions that manage the guide
    var stopPreloader = function() {
        clearInterval(interval);
        d3.selectAll('#intro td').classed('active', true);
        d3.selectAll('#intro').classed('active', true);
        d3.selectAll('#intro *:not(img), #intro').on('click', function() {
            d3.select('#intro')
                .transition()
                .duration(600)
                .style('opacity', 0)
                .each('end', function() {
                    d3.select(this).style('display', 'none');
                    setTimeout(showGuide, 2000);
                });
            d3.select('#buttons').classed('hide', false);
        });
    };
    var showGuide = function() {
        d3.select('#guide').transition().duration(600).style('opacity', 1);
    };
    var guideNextPage = function() {
        if (d3.select('#guide').selectAll('.second').style('display') === 'block') {
            return;
        }
        d3.select('#guide').transition().duration(1000).style('opacity', 0).each('end', function() {
            d3.selectAll('#guide p.first').style('display', 'none');
            d3.selectAll('#guide p.second').style('display', 'block');
            d3.select('#guide')
                .transition()
                .duration(1000)
                .style('opacity', 1);
        });
    };

    var hideGuide = function() {
        d3.select('#guide')
            .transition()
            .duration(600)
            .style('opacity', 0)
            .each('end', function() {
                d3.select(this).style('display', 'none');
            });
    };

    // Will fade out and remove all content of results div
    var clearResults = function(deactivate) {
        d3.selectAll('#results h2, #results h3, #results p, #results div')
            .transition()
            .duration(150)
            .style('opacity', 0)
            .each('end', function() {
                d3.select(this).remove();
                if (deactivate === true) {
                    d3.selectAll('#results, #results-wrapper').classed('active', false);
                }
            });
    };

    var clearActiveTiles = function() {
        d3.selectAll('#tiles td.active')
            .classed('active', false)
            .classed('in', false)
            .classed('out', false)
            .style('background-color', null)
            .on('click', null);
        d3.select('#buttons').classed('hide', false);
    };

    var queryDocuments = function(query, documents) {

        var output = [],
            counter,
            q = query[0] + '(ing|er)?(\\s|,|-){1,2}' + query[1] + '(s|es)?',
            r = new RegExp(q, 'gim'),
            matches;
        for (var doc in documents) {
            counter = 0;
            for (var section in documents[doc][1]) {
                matches = (documents[doc][1][section].match(r) || []).length;
                if (matches >= 0) {
                    counter += matches;
                }
            }
            if (counter > 0) {
                output.push({
                    doc: doc,
                    count: counter
                });
            }
        }
        return output;
    };

    // Wrap all occurances of the query in span elements and also indicate whether passed text was modified or not
    var highlightQuery = function(query, text) {
        var r = new RegExp(query[0] + '(ing|er)?(\\s|,|-){1,2}' + query[1] + '(s|es)?', 'gim');
        return {
            text: text.replace(r, '<span class="s">&nbsp;$&&nbsp;</span>'),
            modified: r.test(text)
        }
    };

    // Format title to display; replace - _ with space and wrap file extension in span
    var formatTitle = function(title) {
        return title.replace(/(-|_)/g, ' ').replace(/\.(docx|pdf|doc|txt)/gi, '<span class="pdf">&nbsp;$&</span>');
    }

    // Return url that searches for the title in WHS website
    var formatSearch = function(title) {
        return 'https://www.worldhumanitariansummit.org/search/apachesolr_search/' +
            encodeURIComponent(title.replace(/(-|_)/g, ' ').replace(/\.(docx|pdf|doc|txt)/gi, ''));
    }

    // Given index check whether it is an input document, output etc accorging to json['profiles']  
    var getClass = function(i) {
        return i < 5 ? 'in' : (i < 11 ? 'out' : (i < 28 ? 'group' : (i < 37 ? 'doc' : 'regio')));
    }

    // Add random activities
    setInterval(function(a) {
        if (d3.select('#labels').classed('hyperactive')) {
            return;
        }
        var selection = d3.selectAll('#tiles td:not(.a)')[0],
            tile = d3.select(selection[Math.floor(Math.random() * selection.length)]);
        tile.classed('rand', true);
        setTimeout(function() {
            tile.classed('rand', false);
        }, Math.random() * 400);
    }, 2000);

    // About button
    d3.select('#about-btn').on('click', function() {
        hideGuide();
        d3.select('#about').classed('active', !d3.select('#about').classed('active'));
    });

    // Load data
    d3.json("data.json", function(json) {

        var triggerSearch = function(query) {

            clearActiveTiles();
            guideNextPage();

            d3.select('#buttons').classed('hide', true);

            var queryResults = queryDocuments(query, json['docs']),
                selectedCells = [],
                availableCells = d3.selectAll('td.a')[0],
                scale = d3.scale.linear().domain([1, 6]).range([0.3, 0.95]).clamp(true);

            while (selectedCells.length < queryResults.length) {
                selectedCells.push(availableCells.splice(Math.floor(Math.random() * (availableCells.length - 26)) + 13, 1)[0]);
            }
            d3.selectAll(selectedCells)
                .data(queryResults)
                .classed('active', true)
                .on('click', function(queryResult) {

                    clearResults();
                    hideGuide();
                    d3.select('#results, #results-wrapper').classed('active', true);

                    var doc = json['docs'][queryResult['doc']],
                        replacement;

                    // Add title
                    d3.select('#results')
                        .append('h2')
                        .append('a')
                        .attr('href', formatSearch(doc[0]))
                        .attr('target', '_blank')
                        .html(formatTitle(doc[0]))
                        .style('opacity', 0)
                        .transition()
                        .duration(250)
                        .delay(300)
                        .style('opacity', 1);

                    // Add icons
                    d3.select('#results')
                        .append('div')
                        .selectAll('span')
                        .data(doc[2])
                        .enter()
                        .append('span')
                        .attr('title', function(d) {
                            return json['profiles'][d];
                        })
                        .classed('icon', true)
                        .style('opacity', 0)
                        .transition()
                        .duration(250)
                        .delay(300)
                        .style('opacity', 1)
                        .each(function(d) {
                            d3.select(this).classed(getClass(d), true);
                        });

                    // Add sections and subtitles
                    for (var section in doc[1]) {

                        replacement = highlightQuery(query, doc[1][section]);

                        d3.select('#results')
                            .append('h3')
                            .classed('hidden', !replacement['modified'])
                            .on('click', function() {
                                d3.select(this).classed('hidden', !d3.select(this).classed('hidden'));
                            })
                            .text(json['header'][section])
                            .style('opacity', 0)
                            .transition()
                            .duration(250)
                            .delay(300)
                            .style('opacity', 1);

                        d3.select('#results')
                            .append('p')
                            .html(replacement['text'])
                            .style('opacity', 0)
                            .transition()
                            .duration(250)
                            .delay(300)
                            .style('opacity', 1);

                    }

                    // Scroll to the top
                    setTimeout(function() {
                        d3.select('#results').node().scrollTop = 0;
                    }, 270);

                }).style('background-color', function(queryResult) {
                    return 'rgba(0, 173, 239, ' + scale(queryResult['count']) + ')';
                });
        };

        // Create div element for each bigram
        var bigrams = d3.set(json['bigrams'].map(function(d) {
                return d[0];
            })).values().sort(),
            divs = d3.select('#labels')
            .selectAll('span')
            .data(bigrams)
            .enter()
            .append('div');

        // Add span with the first word of the bigram
        divs.append('span')
            .text(function(d) {
                return d;
            })
            .on('click', function() {

                // Add active class to selected text
                var active = d3.select(this.parentElement).classed('active');

                d3.selectAll('#labels div').classed('active', false);
                d3.select(this.parentElement).classed('active', !active);
                d3.select('#labels').classed('active', !active);
                d3.select('#about').classed('active', false);

                if (!active) {
                    d3.select('#labels').selectAll('ul').classed('active', false);
                    d3.select(this.parentElement).select('ul').classed('active', true);
                } else {
                    d3.select('#labels').selectAll('ul').classed('active', false);
                    d3.select(this.parentElement.parentElement).classed('right', false);
                    d3.select('#labels').classed('hyperactive', false);
                    d3.select('#labels').selectAll('ul').classed('hyperactive', false);
                    d3.select('#labels').selectAll('li').classed('hyperactive', false);
                    clearResults(true);
                    clearActiveTiles();
                }
            });

        // Add list with the second words of the bigrams
        divs.append('ul').each(function(text) {

            // Find all bigrams that share same first word
            var corresponding = json['bigrams'].reduce(function(a, b) {
                if (b[0] === text)
                    a.push(b[1]);
                return a;
            }, []);

            d3.select(this.parentElement)
                .select('ul')
                .selectAll('li')
                .data(corresponding.sort())
                .enter()
                .append('li')
                .text(function(d) {
                    return d;
                })
                .on('click', function() {
                    // Add active class to selected text
                    var active = d3.select(this).classed('hyperactive');

                    d3.select(this.parentElement).classed('hyperactive', !active).selectAll('li').classed('hyperactive', false);
                    d3.select(this).classed('hyperactive', !active);
                    d3.select('#labels').classed('hyperactive', !active);

                    if (!active) {
                        triggerSearch([
                            d3.select(this.parentElement.parentElement).select('span').text(),
                            d3.select(this).text()
                        ]);
                    } else {
                        clearResults(true);
                        clearActiveTiles();
                    }
                });
        });

        // Display tiles
        var dummy = function(n) {
            var out = [],
                i = 0;
            while (i < n) {
                out.push(i);
                i++;
            }
            return out;
        };
        var rows = d3.select('#tiles').select('table').selectAll('tr').data(dummy(20)).enter().append('tr');
        rows.selectAll('td').data(dummy(38)).enter().append('td').classed('a', function(d, i) {
            return i > 23 && i < 37
        });

        // Stop preloader now - data is downloaded and page is initialized
        stopPreloader();
    });
};