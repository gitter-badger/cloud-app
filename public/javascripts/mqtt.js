var messagesTable;
var topicInput;
var messageInput;
var qosInput;
var topicsTable;

var removeAllRows = function () {
  messagesTable.find('tr').remove();
}

var addNoMessagesRow = function () {
  $('#messages-table tbody').append('<tr><td>Please select topic from left hand menu</td>/tr>');
}

var addNoTopicsRow = function () {
  $('#topics-table tbody').append('<tr><td><b>You have not published any MQTT Message yet</b></td></tr>');
}

var showRowsForMessages = function (messages, flashFirst) {
  var row = '<tr><th>Direction</th><th>Message</th><th>Date</th></tr>';
  $.each(messages, function(i, message) {
    var time = moment(message.created_at, moment.ISO_8601).format('DD.MM.YYYY HH:mm');
    var direction = message.direction === 'out' ? 'Outbound' : 'Inbound'
    row += '<tr><td>' + direction + '</td><td>' + message.message + '</td><td>' + time + '</td></tr>';
  });
  $('#messages-table tbody').append(row);
  if (flashFirst === true) {
    $('#messages-table tr:eq(1)').css('display', 'none').fadeIn(1000);
  }
}

var loadTopics = function () {
  $.ajax('/api/mqtt/topic')
  .done(function (result) {
    topicsTable.find('tr').remove();
    if (result.topics.length === 0) {
      $('#topics-table tbody').append('<tr><td><b>You have not published any MQTT Message yet</b></td><td>&nbsp;</td></tr>');
    }
    var row;
    $.each(result.topics, function (i, topic) {
      row += '<tr><td><a href="#" onclick="loadMessagesForTopic(\''+ topic +'\', 0, false);">' + topic + '</a></td><td><a href="#" onclick="deleteTopic(\'' + topic + '\', ' + i + ');"><span class="glyphicon glyphicon-remove pull-right"></a></td></tr>';
    });
  $('#topics-table tbody').append(row);
  });
}

var loadMessagesForTopic = function (topic, page, flashFirst) {
  removeAllRows();
  if (topicInput.val() !== topic) {
    messageInput.val('');
  }
  topicInput.val(topic);
  $.ajax('/api/mqtt/message?topic=' + topic + '&page=' + page)
  .done(function (result) {
    $('.pagination').pagination({
      items: result.count,
      itemsOnPage: 10,
      currentPage: page == 0 ? 1 : page,
      cssStyle:'compact-theme',
      onPageClick: function (pageNumber, event) {
        loadMessagesForTopic(topic, pageNumber, false)
        return false;
      }
    });
    showRowsForMessages(result.messages, flashFirst);
  });
}

var deleteTopic = function (topic, num) {
  swal({
    title:'Delete Topic', 
    text:'Would your really like to delete this topic?', 
    type:'warning',
    showCancelButton:true
  }, function () {
    removeAllRows();
    $.ajax({
      type: 'DELETE',
      url: '/api/mqtt/message?topic=' + topic
    })
    .done(function (data) {
      $('#topics-table tr#topic_' + num).remove();
      if($('#topics-table tr').length === 0) {
        addNoTopicsRow();
      }
      addNoMessagesRow();
      loadTopics();
    });
  });
}

var dispatchMessage = function () {
  var topic = topicInput.val();
  if (topic.length === 0) {
    swal({
      title: 'No Topic',
      text: 'Please enter or select a topic',
      type: 'error'
    });
    return;
  }
  var message = messageInput.val();
  if (message.length === 0) {
    swal({
      title: 'No Payload',
      text: 'Please enter a message',
      type: 'error'
    });
    return;
  }
  var qos = parseInt(qosInput.val());
  $.ajax({
    type: 'POST',
    url: '/api/mqtt/message',
    contentType: 'application/json',
    data: JSON.stringify({
      topic: topic,
      payload: message,
      qos: qos
    })
  })
  .done(function (data) {
    messageInput.val('');
    loadMessagesForTopic(topic, 0, true);
    loadTopics();
  })
  .fail(function (jqXHR, textStatus) {
    var errorMessage = 'Something went wrong... Please try again.';
    if (jqXHR.status === 400) {
      errorMessage = 'Please check your topic, this needs to be prefixed by your Username like "Username/my-topic"!';
    }
    swal({
      title: 'Error',
      text: errorMessage,
      type: 'error'
    });
  });
}

$(document).ready(function () {
  messagesTable = $('#messages-table');
  topicInput = $('#topic-input');
  messageInput = $('#message-input');
  qosInput = $('#qos-input');
  topicsTable = $('#topics-table');
  loadTopics();
});