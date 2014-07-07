ACLOCAL_AMFLAGS = -I m4 ${ACLOCAL_FLAGS}

uuid = screenshot-window-sizer@hughsie.github.com
localprefix = $(HOME)/.local/share/gnome-shell/extensions
extensiondir = $(datadir)/gnome-shell/extensions/$(uuid)

@GSETTINGS_RULES@

dist_extension_DATA = extension.js stylesheet.css metadata.json
gsettings_SCHEMAS = org.gnome.shell.extensions.screenshot-window-sizer.gschema.xml

EXTRA_DIST = $(gsettings_SCHEMAS)

zip-file: all
	rm -fR $(builddir)/_build
	rm -fR $(builddir)/zip-file
	$(MKDIR_P) $(builddir)/_build; \
	$(MKDIR_P) $(builddir)/zip-file; \
	$(MAKE) install DESTDIR="$(abs_builddir)/_build"; \
	cp -r "$(builddir)/_build$(datadir)/gnome-shell/extensions/$(uuid)" "$(builddir)/_build"; \
	if [ -f "$(builddir)/_build$(datadir)/glib-2.0/schemas/org.gnome.shell.extensions.screenshot-window-sizer.gschema.xml" ]; then \
		$(MKDIR_P) "$(builddir)/_build/$(uuid)/schemas"; \
		mv "$(builddir)/_build$(datadir)/glib-2.0/schemas/org.gnome.shell.extensions.screenshot-window-sizer.gschema.xml" "$(builddir)/_build/$(uuid)/schemas"; \
		glib-compile-schemas "$(builddir)/_build/$(uuid)/schemas"; \
	fi; \
	(cd "$(builddir)/_build/$(uuid)/"; \
	 zip -qr "$(abs_builddir)/zip-file/screenshot-window-sizer.shell-extension.zip" .; \
	); \
	rm -fR $(builddir)/_build

local-install: zip-file
	zip_file="$(abs_builddir)/zip-file/screenshot-window-sizer.shell-extension.zip"; \
	if [ -d "$(localprefix)/$(uuid)" ]; then \
	rm -fR "$(localprefix)/$(uuid)"; \
	fi; \
	$(MKDIR_P) $(localprefix)/$(uuid); \
	(cd $(localprefix)/$(uuid); \
	unzip -q $${zip_file}; \
	);
