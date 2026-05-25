function Pagination({
  page,
  totalPages,
  setPage,
}) {
  return (
    <div className="pagination">

      <button
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
      >
        ←
      </button>

      <span>Page {page}</span>

      <button
        disabled={page === totalPages}
        onClick={() => setPage(page + 1)}
      >
        →
      </button>

    </div>
  );
}

export default Pagination;