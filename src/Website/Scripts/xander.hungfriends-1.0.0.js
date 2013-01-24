$(function () {
    console.log("initialising page");
    var words = [];
    loadWords();


    function loadWords() {
        $.ajax({
            url: "/data/words.js",
            dataType: "json"
        }).done(function(data) {
            words = data;
            console.log("words loaded: ", data.length);
        });
    }
});