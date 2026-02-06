const db = require('../models/database').db;

exports.saveSearch = (req, res) => {
  try {
    const { search_name, filters } = req.body;
    
    if (!search_name || !filters) {
      return res.status(400).json({ error: 'Search name and filters are required' });
    }

    const insert = db.prepare(`
      INSERT INTO saved_searches (user_id, search_name, filters, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const result = insert.run(req.user.id, search_name, JSON.stringify(filters));

    res.json({
      id: result.lastInsertRowid,
      search_name,
      filters,
      message: 'Search saved successfully'
    });
  } catch (error) {
    console.error('Error saving search:', error);
    res.status(500).json({ error: 'Failed to save search' });
  }
};

exports.getSavedSearches = (req, res) => {
  try {
    const searches = db.prepare(`
      SELECT id, search_name, filters, created_at 
      FROM saved_searches 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    const parsed = searches.map(s => ({
      ...s,
      filters: JSON.parse(s.filters)
    }));

    res.json(parsed);
  } catch (error) {
    console.error('Error fetching saved searches:', error);
    res.status(500).json({ error: 'Failed to fetch saved searches' });
  }
};

exports.deleteSavedSearch = (req, res) => {
  try {
    const { id } = req.params;

    const search = db.prepare('SELECT user_id FROM saved_searches WHERE id = ?').get(id);
    
    if (!search) {
      return res.status(404).json({ error: 'Saved search not found' });
    }

    if (search.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this search' });
    }

    db.prepare('DELETE FROM saved_searches WHERE id = ?').run(id);

    res.json({ message: 'Saved search deleted successfully' });
  } catch (error) {
    console.error('Error deleting saved search:', error);
    res.status(500).json({ error: 'Failed to delete saved search' });
  }
};

exports.advancedSearch = (req, res) => {
  try {
    const {
      query,
      dateFrom,
      dateTo,
      purpose,
      minMiles,
      maxMiles,
      minExpenses,
      maxExpenses,
      sortBy,
      sortOrder
    } = req.query;

    let sql = 'SELECT * FROM trips WHERE user_id = ?';
    const params = [req.user.id];

    if (query) {
      sql += ' AND (from_address LIKE ? OR to_address LIKE ? OR site_name LIKE ? OR expense_notes LIKE ?)';
      const searchPattern = `%${query}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (dateFrom) {
      sql += ' AND date >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      sql += ' AND date <= ?';
      params.push(dateTo);
    }

    if (purpose) {
      sql += ' AND purpose = ?';
      params.push(purpose);
    }

    if (minMiles) {
      sql += ' AND miles_calculated >= ?';
      params.push(parseFloat(minMiles));
    }

    if (maxMiles) {
      sql += ' AND miles_calculated <= ?';
      params.push(parseFloat(maxMiles));
    }

    if (minExpenses || maxExpenses) {
      sql += ' AND (lodging_cost + meals_cost + other_expenses)';
      if (minExpenses) {
        sql += ' >= ?';
        params.push(parseFloat(minExpenses));
      }
      if (maxExpenses) {
        sql += ' <= ?';
        params.push(parseFloat(maxExpenses));
      }
    }

    const validSortColumns = ['date', 'miles_calculated', 'from_address', 'to_address'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'date';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${sortColumn} ${order}`;

    const trips = db.prepare(sql).all(...params);

    res.json(trips);
  } catch (error) {
    console.error('Error in advanced search:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
};
