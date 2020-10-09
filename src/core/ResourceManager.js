function ResourceManager() {
    this.images = {};
    this.configuration = {};
    this.maps = {};
    this.sounds = {};
    this.objectLists = {};
    this.nerps = [];
    this.nerpMessages = [];
    this.fonts = [];

    this.assets = [ // TODO currently statically loaded resources, maybe loadable via config, too?
        ['wad0nerp', 'Levels', 'nerpnrn.h'], // included by other nrn scripts

        // main menu resources
        ['wad0bmp', 'Interface/FrontEnd/MenuBGpic.bmp'], // main menu background
        ['wad0font', 'Interface/FrontEnd/Menu_Font_LO.bmp'], // main menu font
        ['wad0font', 'Interface/FrontEnd/Menu_Font_HI.bmp'], // (highlighted) main menu font
        ['wad0font', 'Interface/Fonts/Font5_Hi.bmp'],
        ['wad0bmp', 'Interface/Frontend/LP_Normal.bmp'], // back button in level select view
        ['wad0bmp', 'Interface/Frontend/LP_Glow.bmp'], // back button in level select view (hovered)
        ['wad0bmp', 'Interface/Frontend/LP_Dull.bmp'], // back button in level select view (pressed)
        ['wad0alpha', 'Interface/Frontend/LowerPanel.bmp'], // lower panel in level select view
        ['wad0bmp', 'Interface/Frontend/SaveLoad.bmp'],

        // level images
        ['wad0bmp', 'Interface/LEVELPICKER/Levelpick.bmp'], // level select menu background
        ['wad0bmp', 'Interface/LEVELPICKER/LevelpickT.bmp'], // tutorial level select menu background

        // pointers/cursors
        ['wad0alpha', 'Interface/Pointers/Aclosed.bmp'],
    ];

}

ResourceManager.prototype = {

    loadResources(onProgress) {
        // FIXME load all resources from WAD/other file
    },

};

export { ResourceManager };
