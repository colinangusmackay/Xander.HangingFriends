var words = "";
$(function () {
    loadWords();

    $("#reset").click(function () {
        window.location = "/index.html";
    });
    $("#not-enough-tiles").popup();
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
        var result = "tile " + invertedPrefix + tileName + dimToggle;
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

    this.clickGuessedTile = function () {
        if (theViewModel.currentLetter() === this.letter()) {
            this.removeHighlight();
            theViewModel.currentLetter("");
            if (this.letter() === "unknown") {
                this.setIsGuessedLetter(false);
            } else {
                var answerTile = ko.utils.arrayFirst(theViewModel.individualCorrectLetters, function (item) { return this.letter() === item.letter(); }, this);
                if (answerTile === null)
                    this.setIsGuessedLetter(false);
            }
        } else {
            this.setHighlighted();
            theViewModel.currentLetter(this.letter());
            this.setIsGuessedLetter(true);
        }
    };

    this.setIsGuessedLetter = function (state) {
        if (this.letter() === "unknown")
            this.isGuessedLetter(false);
        else
            this.isGuessedLetter(state);
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
        this.viewModel.hasResults(hasResults);

        function buildRegEx() {
            var searchLetters = buildSearchLetters();
            var letters = ko.utils.arrayMap(theViewModel.individualCorrectLetters, function (item) {
                if (item.letter().length === 1)
                    return item.letter();
                else if (item.letter() === "unknown")
                    return searchLetters;
                return "";
            });
            var regEx = "^";
            ko.utils.arrayForEach(letters, function (item) { regEx += item; });
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
            var index = ko.utils.arrayIndexOf(this.viewModel.individualCorrectLetters, this);
            if ((index < 7) && (this.viewModel.individualCorrectLetters[index + 1].letter() != "not-used"))
                this.letter("unknown");
            else
                this.letter("not-used");
        }
        var isDone = false;
        var currentTile = this;
        ko.utils.arrayForEach(this.viewModel.individualCorrectLetters, function (item) {
            if (item === currentTile)
                isDone = true;
            if (isDone)
                return;
            if (item.letter() === "not-used")
                item.letter("unknown");
        });
    };
}.bind(this);

var viewModel = function () {
    this.currentLetter = ko.observable("");
    this.individualCorrectLetters = [];
    for (var i = 0; i < 8; i++)
        this.individualCorrectLetters.push(new tile("not-used", this, this.individualCorrectLetters));
    this.individualGuessedLetters = [];
    for (var c = 97; c < 123; c++)
        this.individualGuessedLetters.push(new tile(String.fromCharCode(c), this, this.individualGuessedLetters));
    this.individualGuessedLetters.push(new tile("unknown", this, this.individualGuessedLetters));
    var searchTile = new tile("search", this, null);
    searchTile.isSearch = (true);
    this.individualGuessedLetters.push(searchTile);

    this.results = ko.observableArray();
    this.fullResults = [];
    this.hasResults = ko.observable(false);
    this.isEnoughGuessedLetters = function () {
        return (this.individualCorrectLetters[3].letter() !== "not-used");
    };
};

ko.applyBindings(new viewModel());

