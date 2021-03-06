﻿var words = "";
$(function () {
    loadWords();

    $("#reset").click(function () {
        window.location = "/";
    });
    $("#not-enough-tiles").popup();

    $(".drag-source").draggable({
        containment: "#drag-drop-container",
        scroll: false,
        revert: "invalid",
        helper: "clone"
    });

    $(".drop-target").droppable({
        accept: ".drag-source",
        drop: function (event, ui) {
            var source = ko.dataFor(ui.draggable.get(0));
            var target = ko.dataFor(this);
            source.dragTo(target);
        }
    });


    function loadWords() {
        $.ajax({
            url: "/data/words.txt",
            dataType: "html"
        }).done(function (data) {
            words = data;
        });
    }
});

var tile = function (letter, theViewModel, container) {
    
    // data
    this.letter = ko.observable(letter);
    this.isGuessedLetter = ko.observable(false);
    this.isHighlighted = ko.observable(null);
    this.container = container;
    this.viewModel = theViewModel;
    this.isSearch = false;

    this.cssClass = ko.computed(function () {
        var invertedPrefix = (this.isGuessedLetter() ? "inv-" : "");
        var tileName = "tile-" + this.letter().toLowerCase();
        var dimToggle = (this.isHighlighted() === false ? " tile-dimmed" : "");
        var dragDrop = (this.container === theViewModel.answerRack)
            ? " drop-target"
            : ((this.container === theViewModel.individualGuessedLetters)
                ? " drag-source"
                : "");
        var result = "tile " + invertedPrefix + tileName + dimToggle + dragDrop;
        return result;
    }, this);

    this.setHighlighted = function () {
        ko.utils.arrayForEach(this.container, function (item) {
            item.isHighlighted(false);
        });
        this.isHighlighted(true);
    };

    this.removeHighlight = function () {
        ko.utils.arrayForEach(this.container, function (item) {
            item.isHighlighted(null);
        });

    };

    this.setIsGuessedLetter = function (state) {
        if (this.letter() === "unknown")
            this.isGuessedLetter(false);
        else
            this.isGuessedLetter(state);
    };

    // events

    this.dragTo = function (target) {
        theViewModel.currentLetter("");
        target.letter("not-used");
        this.clickGuessedTile();
        target.clickAnswerTile();
    };
    
    this.clickGuessedTile = function () {
        if (theViewModel.currentLetter() === this.letter()) {
            this.removeHighlight();
            theViewModel.currentLetter("");
            if (this.letter() === "unknown") {
                this.setIsGuessedLetter(false);
            } else {
                var answerTile = ko.utils.arrayFirst(theViewModel.answerRack, function (item) { return this.letter() === item.letter(); }, this);
                if (answerTile === null)
                    this.setIsGuessedLetter(false);
            }
        } else {
            this.setHighlighted();
            theViewModel.currentLetter(this.letter());
            this.setIsGuessedLetter(true);
        }
    };

    this.clickSearchTile = function () {
        this.viewModel.hasResults(false);
        this.viewModel.results.removeAll();
        if (!this.viewModel.isEnoughGuessedLetters()) {
            console.log("not enough tiles");
            $("#not-enough-tiles").popup("open");
            return;
        }

        var regex = buildRegEx();
        var result = words.match(regex);
        if (result === null)
            result = [];
        this.viewModel.fullResults = result;
        var viewModelResults = this.viewModel.results;
        ko.utils.arrayForEach(result, function (item) {
            var count = viewModelResults().length;
            if (count > 200)
                return;
            if (count === 200)
                viewModelResults.push("<strong>Too many results found.</strong>");
            else
                viewModelResults.push(item);
        });
        var hasResults = viewModelResults().length > 0;
        this.viewModel.totalResults(result.length);
        this.viewModel.hasResults(hasResults);

        if (!hasResults)
            $("#no-results-found").popup("open");
        else if (result.length > 200)
            $("#too-many-results").popup("open");

        this.viewModel.updateSuggestedLettersToTry();

        function buildRegEx() {
            var searchLetters = buildSearchLetters();
            var lastVowel = theViewModel.lastVowelIndexInAnswerRack();
            var vowellessSearchLetters = searchLetters.replace("a", "").replace("e", "").replace("i", "").replace("o", "").replace("u", "");
            var regEx = "^";
            for (var i = 0; i < theViewModel.answerRack.length; i++) {
                var currentTile = theViewModel.answerRack[i];
                if (currentTile.letter().length === 1) {
                    regEx += currentTile.letter();
                } else if (currentTile.letter() === "unknown") {
                    if (i > lastVowel)
                        regEx += vowellessSearchLetters;
                    else
                        regEx += searchLetters;
                }
            }
            regEx += "$";
            var pattern = new RegExp(regEx, "gm");
            return pattern;
        }

        function buildSearchLetters() {
            var letters = ko.utils.arrayMap(theViewModel.individualGuessedLetters, function (item) {
                if (item.letter().length !== 1)
                    return "";
                if (item.isGuessedLetter() === true)
                    return "";
                return item.letter();
            });
            var result = "[";
            ko.utils.arrayForEach(letters, function (item) { result += item; });
            result += "]";
            return result;
        }
    };

    this.clickAnswerTile = function () {
        if (this.viewModel.currentLetter() === "")
            return;
        if ((this.letter() === "not-used") || (this.letter() !== theViewModel.currentLetter()))
            this.letter(theViewModel.currentLetter());
        else if (this.letter() === theViewModel.currentLetter()) {
            var index = ko.utils.arrayIndexOf(this.viewModel.answerRack, this);
            if ((index < 7) && (this.viewModel.answerRack[index + 1].letter() != "not-used"))
                this.letter("unknown");
            else
                this.letter("not-used");
        }
        var isDone = false;
        var currentTile = this;
        ko.utils.arrayForEach(this.viewModel.answerRack, function (item) {
            if (item === currentTile)
                isDone = true;
            if (isDone)
                return;
            if (item.letter() === "not-used")
                item.letter("unknown");
        });
    };
}.bind(this);

var suggestion = function(letter, occurrences, total) {
    this.letter = letter;
    this.occurences = occurrences;
    this.total = total;
    this.percentage = ko.computed(function() {
        var result = ((this.occurences / this.total) * 100).toFixed(1);
        return result;
    }, this);
}.bind(this);

var viewModel = function () {
    this.currentLetter = ko.observable("");
    this.answerRack = [];
    for (var i = 0; i < 8; i++)
        this.answerRack.push(new tile("not-used", this, this.answerRack));
    this.individualGuessedLetters = [];
    for (var c = 97; c < 123; c++)
        this.individualGuessedLetters.push(new tile(String.fromCharCode(c), this, this.individualGuessedLetters));
    this.individualGuessedLetters.push(new tile("unknown", this, this.individualGuessedLetters));
    var searchTile = new tile("search", this, null);
    searchTile.isSearch = (true);
    this.individualGuessedLetters.push(searchTile);

    this.results = ko.observableArray();
    this.totalResults = ko.observable(0);
    this.fullResults = [];
    this.hasResults = ko.observable(false);
    this.isEnoughGuessedLetters = function () {
        return (this.answerRack[3].letter() !== "not-used");
    };

    this.suggestedLettersToTry = ko.observableArray();

    this.lastVowelIndexInAnswerRack = function() {
        for (var i = 7; i >= 0; i--) {
            var currentTile = this.answerRack[i];
            var letter = currentTile.letter();
            switch (letter) {
                case "a": case "e": case "i": case "o": case "u":
                return i;
            }
        }
        return i;
    };

    this.isLetterInAnswerRack = function(letter) {
        var found = ko.utils.arrayFirst(this.answerRack, function(item) {
            return (item.letter() == letter);
        });
        return (found !== null);
    };

    this.updateSuggestedLettersToTry = function() {
        this.suggestedLettersToTry.removeAll();
        var letters = { "a": 0, "b": 0, "c": 0, "d": 0, "e": 0, "f": 0, "g": 0, "h": 0, "i": 0, "j": 0, "k": 0, "l": 0, "m": 0, "n": 0, "o": 0, "p": 0, "q": 0, "r": 0, "s": 0, "t": 0, "u": 0, "v": 0, "w": 0, "x": 0, "y": 0, "z": 0 };
        var totalWords = this.fullResults.length;
        for (var i = 0; i < totalWords; i++) {
            var word = this.fullResults[i];
            var currentLetters = ko.utils.arrayGetDistinctValues(word);
            for (var j = 0; j < currentLetters.length; j++) {
                var currentValue = letters[currentLetters[j]];
                letters[currentLetters[j]] = currentValue + 1;
            }
        }

        for (letter in letters) {
            var value = letters[letter];
            if (value === 0)
                continue;

            if (this.isLetterInAnswerRack(letter))
                continue;

            this.suggestedLettersToTry.push(new suggestion(letter, value, totalWords));
        }
        this.suggestedLettersToTry.sort(function(left, right) {
            return right.occurences - left.occurences;
        });
    };
};

ko.applyBindings(new viewModel());

