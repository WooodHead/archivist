var cheerio = require('cheerio');
var _ = require('underscore');
global.$ = cheerio.load('', {decodeEntities: false});
var utils = require('./utils');

function _indexMeta(interview, commands, update, subjectTree) {
  // calculate stats for subjects
  var subjectsCount = {};
  function _updateCounter(id) {
    if (!subjectsCount[id]) {
      subjectsCount[id] = 1;
    } else {
      subjectsCount[id]++;
    }
  }
  function _countSubject(id) {
    var node = subjectTree.get(id);
    while(node) {
      _updateCounter(node.id);
      node = subjectTree.getParent(node.id);
    }
  }
  var subjectRefs = interview.getIndex('type').get('subject_reference');
  _.each(subjectRefs, function(ref) {
    _.each(ref.target, function(id) {
      _countSubject(id);
    });
  });
  var subjects = Object.keys(subjectsCount);
  subjectsCount = _.map(subjectsCount, function(count, id) {
    return {
      id: id,
      count: count,
      one: 1
    };
  });
  // calculate stats for entities
  var entitiesCount = {};
  var entityRefs = interview.getIndex('type').get('entity_reference');
  _.each(entityRefs, function(ref) {
    var id = ref.target;
    entitiesCount[ref.target] = (entitiesCount[id] || 0) + 1;
  });
  var entities = Object.keys(entitiesCount);
  entitiesCount = _.map(entitiesCount, function(count, id) {
    return {
      id: id,
      count: count,
      one: 1
    };
  });

  var documentNode = interview.get('document');
  var command = {};
  var commandName = update ? 'update' : 'index';
  command[commandName] = {
    _index: 'interviews',
    _type: 'interview',
    _id: interview.id,
  };
  var metadata = {
    "summary": documentNode.short_summary,
    "summary_en": documentNode.short_summary_en,
    "title": documentNode.title,
    "published_on": documentNode.published_on,
    "interview_date": documentNode.interview_date,
    "project_name": documentNode.project_name,
    "interview_duration": documentNode.interview_duration,
    "record_type": documentNode.record_type,
    "interviewee_photo": documentNode.interviewee_photo,
    "published": documentNode.published,
    "subjects": subjects,
    "subjects_count": subjectsCount,
    "entities": entities,
    "entities_count": entitiesCount
  };
  if (update) {
    var data = {"doc": metadata, "upsert": metadata};
  } else {
    var data = metadata;
  }
  commands.push(command);
  commands.push(data);
}

function indexMeta(interview, commands, update, cb) {
  utils.getSubjectTree(function(err, subjectTree) {
    if (err) return cb(err);
    _indexMeta(interview, commands, update, subjectTree);
    cb(null);
  });
}

function indexFragments(interview, commands, update, cb) {
  var documentNode = interview.get('document');
  var htmlExporter = new interview.constructor.HtmlExporter({
    skipTypes: {
      'timecode': true
    },
    exportAnnotationFragments: true,
    containerId: 'content'
  });
  htmlExporter.initialize(interview);

  var content = interview.get('content');
  var nodeIds = content.nodes;

  nodeIds.forEach(function(nodeId, pos) {
    var node = interview.get(nodeId);
    if (!node) {
      throw new Error("Corrupted interview json. Node does not exist " + nodeId);
    }
    var type = node.type;
    var nodeContent = node.content;
    if (!nodeContent) {
      return;
    }
    var nodeHtml = htmlExporter.convertNode(node).html();

    var entityFacets = [];
    var subjectFacets = [];
    var path = [node.id, 'content'];
    var annotations = interview.getIndex('annotations').get(path);
    _.each(annotations, function(anno) {
      if (anno.type === "entity_reference") {
        var id = anno.target;
        entityFacets.push(id);
      }
    });
    var annotationFragments = interview.containerAnnotationIndex.getFragments(path, 'content');
    _.each(annotationFragments, function(annoFragment) {
      var anno = annoFragment.anno;
      if (anno.type === "subject_reference") {
        _.each(anno.target, function(id) {
          subjectFacets.push(id);
        });
      }
    });
    subjectFacets = _.uniq(subjectFacets);

    var entryId = nodeId;
    var command = {};
    var commandName = update ? 'update' : 'index';
    command[commandName] = {
      _index: 'interviews',
      _type: 'fragment',
      _parent: interview.id,
      _id: entryId
    };
    var metadata = {
      id: nodeId,
      type: type,
      content: nodeHtml,
      published: documentNode.published,
      position: pos,
      subjects: subjectFacets,
      entities: entityFacets
    };
    if (update) {
      var data = {"doc": metadata, "upsert": metadata};
    } else {
      var data = metadata;
    }
    commands.push(command);
    commands.push(data);
  });

  cb(null);
}

/**
 * @param interview Interview instance
 * @param mode Use 'meta' if you want to update the meta data ('interview' type) only.
 * @return an array of commands that can be used with `client.bulk()`
 */
module.exports = function getIndexingCommands(interview, mode, cb) {
  if (arguments.length === 2) {
    cb = arguments[1];
    mode = "all";
  }
  var commands = [];
  function _finally(err) {
    if (err) return cb(err);
    cb(null, commands);
  }
  if (mode === "meta") {
    // Update interview's metadata
    indexMeta(interview, commands, true, _finally);
  } else if (mode === "update") {
    // Update interview's metadata and fragments
    indexMeta(interview, commands, true, function(err) {
      if (err) return cb(err);
      indexFragments(interview, commands, true, _finally);
    });
  } else {
    // Index interview's metadata and fragments
    indexMeta(interview, commands, false, function(err) {
      if (err) return cb(err);
      indexFragments(interview, commands, false, _finally);
    });
  }
};
