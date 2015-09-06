'use strict';

var _ = require('substance/basics/helpers');
var Component = require('substance/ui/component');
var $$ = Component.$$;
var util = require('./util');

var Details = Component.extend({
	render: function() {
    var el = $$('div').addClass('details');
    el.append($$('div').addClass('helper click back').append([
      $$('i').addClass('fa fa-hand-o-left'),
      " " + i18n.t("resources.go_back")
    ]).on('click', this.goBack));
    if(this.props.resource) {
      var resource = this.props.resource;
      switch(resource.type) {
        case 'toponym':
          el.append($$('a').attr({href: "/maps/" + resource._id, target: "_blank"}).addClass('helper map').append([
            i18n.t("resources.open_map") + " ",
            $$('i').addClass('fa fa-crosshairs')
          ]));
          el.append(this._renderToponym(resource));
          break;
        case 'prison':
          el.append($$('a').attr({href: "/maps/" + resource._id, target: "_blank"}).addClass('helper map').append([
            i18n.t("resources.open_map") + " ",
            $$('i').addClass('fa fa-crosshairs')
          ]));
          el.append(this._renderPrison(resource));
          break;
        case 'person':
          el.append(this._renderPerson(resource));
          break;
        case 'definition':
          el.append(this._renderDefinition(resource));
          break;
        default:
          break
      }
      el.append($$("div").addClass("stats").append(this._renderStats(resource.search.stats)));
      el.append(this._renderReferences(resource));
    }
    return el;
  },

  goBack: function() {

  },

  generateDescription: function() {
    var self = this;
    setTimeout(function(){
      self.refs.description.$el.html(self.props.resource.description);
    }, 0);
  },

  _renderPrison: function(resource) {
    var className = ["resource prison"];
    var prisonType = (resource.prison_type instanceof Array ? resource.prison_type.join(', ') : '');
    var name = resource.name.toLowerCase().indexOf("неизвестно") >= 0 ? i18n.t('resource.unknown_name') : resource.name;
    var location = resource.country;
    if (resource.nearest_locality) location = location + ', ' + resource.nearest_locality;
    var descriptionWrapper = $$("div").attr({class: "description"}).key('description');
    var el = $$("div").attr({"data-id": resource.id, class: className.join(" ")}).append([
      $$("div").attr({class: "resource-header"}).append([
        $$("div").attr({class: "resource-type"}).append(prisonType),
        $$("div").attr({class: "location"}).append(location)
      ]),
      $$("div").attr({class: "name"}).append(name),
      descriptionWrapper
    ]);
    this.generateDescription();
    return el;
  },

  _renderToponym: function(resource) {
    var className = ["resource location"];
    var location = resource.country;
    if(resource.name !== resource.current_name && resource.current_name) location = location + ", " + resource.current_name;
    var descriptionWrapper = $$("div").attr({class: "description"}).key('description');
    var el = $$("div").attr({"data-id": resource.id, class: className.join(" ")}).append([
      $$("div").attr({class: "resource-header"}).append([
        $$("div").attr({class: "name"}).append(resource.name),
        $$("div").attr({class: "location"}).append(location)
      ]), 
      descriptionWrapper
    ]);
    this.generateDescription();
    return el;
  },

  _renderPerson: function(resource) {
    var className = ["resource person"];
    var descriptionWrapper = $$("div").attr({class: "description"}).key('description');
    var el =$$("div").attr({"data-id": resource.id, class: className.join(" ")}).append([
      $$("div").attr({class: "name"}).append(resource.name),
      descriptionWrapper
    ]);
    this.generateDescription();
    return el;
  },

  _renderDefinition: function(resource) {
    var className = ["resource definition"];
    var descriptionWrapper = $$("div").attr({class: "description"}).key('description');
    var el = $$("div").attr({"data-id": resource.id, class: className.join(" ")}).append([
      $$("div").attr({class: "name"}).append(resource.title),
      descriptionWrapper
    ]);
    this.generateDescription();
    return el;
  },

  _renderStats: function(stats) {
    var storage = window.storage || window.localStorage;
    var locale = storage.getItem('locale') || "ru";
    if(locale == "ru") {
      return stats.fragments + " " + util.declOfNum(stats.fragments, ['упоминание', 'упоминания', 'упоминаний']) + " в " + stats.documents + " " + util.declOfNum(stats.documents, ['документе', 'документах', 'документах']);
    } else {
      return "mentioned " + stats.fragments + " times in " + stats.documents + " documents";
    }
  },

  _renderReferences: function(resource) {
    var storage = window.storage || window.localStorage;
    var locale = storage.getItem('locale') || "ru";

    var docs = _.sortBy(resource.search.documents, function(doc) { return doc.published_on; });
    var docs = docs.reverse();
    var references = $$("div").addClass('references');
    _.each(docs, function(doc){
      var intro, stats;
      if(locale == 'ru') {
        intro = doc.summary;
        stats = doc.stats + " " + util.declOfNum(doc.stats, ['упоминание', 'упоминания', 'упоминаний']);
      } else {
        intro = doc.summary_en;
        stats = "Mentioned " + doc.stats + " times";
      }
      var date = util.formatDate(doc.interview_date);
      var iconClass = doc.record_type === 'video' ? 'fa-video-camera' : 'fa-volume-up';
      var preview = $$("div").addClass('document').append([
        $$("div").addClass('photo').attr({"background-image": "url(" + window.mediaServer + "/photos/" + doc.interviewee_photo + ")"}),
        $$("div").attr({class: "meta-info"}).append([
          $$("div").attr({class: "date"}).append(doc.project_name),
          $$("div").attr({class: "length"}).append(doc.interview_duration + " " + i18n.t("interview.minutes")),
          $$("div").attr({class: "date"}).append(date),
          $$("div").attr({class: "source-type"}).append($$("i").addClass('fa ' + iconClass))
        ]),
        $$("div").attr({class: "title"}).append(
          $$('a').attr({href: "/documents/" + doc.id + "#contextId=entities;entityId=" + resource.id + ";filterByType=" + resource.type, "target": "_blank"}).append(doc.title)
        ),
        $$("div").addClass("doc-stats").append(stats),
        $$("div").addClass("intro").append(intro)
      ]);
      references.append(preview);
    });
    return references;
  }
});

module.exports = Details;