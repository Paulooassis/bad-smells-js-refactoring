const STANDARD_USER_MAX_VALUE = 500;
const PRIORITY_VALUE_THRESHOLD = 1000;

/**
 * Políticas de acesso: cada papel decide quais itens vê e quais recebem destaque.
 */
const adminPolicy = {
  selectItems(items) {
    items
      .filter((item) => item.value > PRIORITY_VALUE_THRESHOLD)
      .forEach((item) => {
        item.priority = true;
      });
    return items;
  },
  isHighlighted: (item) => Boolean(item.priority),
};

const standardUserPolicy = {
  selectItems: (items) => items.filter((item) => item.value <= STANDARD_USER_MAX_VALUE),
  isHighlighted: () => false,
};

const noAccessPolicy = {
  selectItems: () => [],
  isHighlighted: () => false,
};

const ROLE_POLICIES = new Map([
  ['ADMIN', adminPolicy],
  ['USER', standardUserPolicy],
]);

/**
 * Formatos de saída: cada formato sabe escrever o próprio cabeçalho, linha e rodapé.
 */
const csvFormat = {
  header: () => 'ID,NOME,VALOR,USUARIO\n',
  row: (item, user) => `${item.id},${item.name},${item.value},${user.name}\n`,
  footer: (total) => `\nTotal,,\n${total},,\n`,
};

const htmlFormat = {
  header: (user) =>
    '<html><body>\n' +
    '<h1>Relatório</h1>\n' +
    `<h2>Usuário: ${user.name}</h2>\n` +
    '<table>\n' +
    '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n',
  row: (item, _user, highlighted) => {
    const style = highlighted ? ' style="font-weight:bold;"' : '';
    return `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
  },
  footer: (total) => `</table>\n<h3>Total: ${total}</h3>\n</body></html>\n`,
};

const unknownFormat = {
  header: () => '',
  row: () => '',
  footer: () => '',
};

const REPORT_FORMATS = new Map([
  ['CSV', csvFormat],
  ['HTML', htmlFormat],
]);

const sumValues = (items) => items.reduce((total, item) => total + item.value, 0);

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  /**
   * Gera um relatório de itens baseado no tipo e no usuário.
   * - Admins veem tudo.
   * - Users comuns só veem itens com valor <= 500.
   */
  generateReport(reportType, user, items) {
    const format = REPORT_FORMATS.get(reportType) ?? unknownFormat;
    const policy = ROLE_POLICIES.get(user.role) ?? noAccessPolicy;
    const visibleItems = policy.selectItems(items);

    const rows = visibleItems.map((item) => format.row(item, user, policy.isHighlighted(item)));
    const report = format.header(user) + rows.join('') + format.footer(sumValues(visibleItems));

    return report.trim();
  }
}
