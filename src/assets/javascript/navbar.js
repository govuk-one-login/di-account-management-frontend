var navbar = function () {
    function navbarInit() {
        var navMenuButton = document.querySelector(".govuk-header__menu-button");
        var navList = document.querySelector(".govuk-header__navigation");

        navMenuButton.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
                if (navMenuButton.classList.contains("govuk-header__menu-button--open")) {
                    navMenuButton.classList.remove("govuk-header__menu-button--open")
                    navList.classList.remove("govuk-header__navigation--open")
                } else {
                    navMenuButton.classList.add("govuk-header__menu-button--open")
                    navList.classList.add("govuk-header__navigation--open")
                }
            }.bind(this)
        );
    }

    return {
        navbarInit
    };
}

window.GOVSignIn = window.GOVSignIn || {};
window.GOVSignIn.Navbar = navbar;
