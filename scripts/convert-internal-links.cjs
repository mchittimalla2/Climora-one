module.exports = function transformer(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  let changed = false;
  let needsLinkImport = false;

  root
    .find(j.JSXElement, {
      openingElement: {
        name: {
          type: 'JSXIdentifier',
          name: 'a',
        },
      },
    })
    .forEach((path) => {
      const opening = path.node.openingElement;

      const hrefAttribute = opening.attributes.find(
        (attribute) =>
          attribute.type === 'JSXAttribute' &&
          attribute.name?.name === 'href'
      );

      if (
        !hrefAttribute ||
        hrefAttribute.value?.type !== 'StringLiteral'
      ) {
        return;
      }

      const href = hrefAttribute.value.value;

      // Convert only internal application URLs.
      // Leaves https://, http://, mailto:, tel:, #, and // URLs unchanged.
      if (!href.startsWith('/') || href.startsWith('//')) {
        return;
      }

      opening.name.name = 'Link';

      if (
        path.node.closingElement?.name?.type === 'JSXIdentifier'
      ) {
        path.node.closingElement.name.name = 'Link';
      }

      hrefAttribute.name.name = 'to';

      changed = true;
      needsLinkImport = true;
    });

  if (needsLinkImport) {
    const routerImport = root.find(j.ImportDeclaration, {
      source: {
        value: 'react-router-dom',
      },
    });

    if (routerImport.size() > 0) {
      routerImport.forEach((path) => {
        const alreadyImported = path.node.specifiers.some(
          (specifier) =>
            specifier.type === 'ImportSpecifier' &&
            specifier.imported?.name === 'Link'
        );

        if (!alreadyImported) {
          path.node.specifiers.push(
            j.importSpecifier(j.identifier('Link'))
          );
        }
      });
    } else {
      root
        .find(j.Program)
        .get('body', 0)
        .insertBefore(
          j.importDeclaration(
            [j.importSpecifier(j.identifier('Link'))],
            j.literal('react-router-dom')
          )
        );
    }
  }

  return changed
    ? root.toSource({
        quote: 'double',
        trailingComma: true,
      })
    : fileInfo.source;
};