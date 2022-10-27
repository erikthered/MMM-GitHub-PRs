Module.register("github-prs", {
	defaults: {
		maxPullRequests: 20,
		rootUrl: "https://github.com",
		updateInterval: 1000 * 60 * 10
	},

	start: function () {
		this.url = this.config.rootUrl + "/api/graphql";
		this.prs = [];
		this.updateCycle();
		setInterval(this.updateCycle, this.config.updateInterval);
	},

	updateCycle: async function () {
		this.prs = [];
		await this.updateData();
		this.updateDom();
	},

	getDom: function () {
		let wrapper = document.createElement("div");
		let header = document.createElement("h2");
		header.innerText = "Pull Requests to Review";
		wrapper.append(header);
		let list = document.createElement("ul");
		this.prs.forEach((pr) => {
			let entry = document.createElement("li");
			entry.innerText = `#${pr.number} | ${pr.repo} | ${pr.title}`;
			list.append(entry);
		});
		wrapper.append(list);
		return wrapper;
	},

	updateData: async function () {
		const query = `
    query searchReviewRequests($query: String!, $limit: Int!) {
      search(
        query: $query
        type: ISSUE
        first: $limit
      ) {
        issueCount
        nodes {
          ... on PullRequest {
            repository {
              name
            }
            number
            title
          }
        }
      }
    }
    `;
		const req = await fetch(this.url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.config.accessToken}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				query: query,
				variables: {
					query: "type:pr state:open review-requested:" + this.config.login,
					limit: this.config.maxPullRequests
				}
			})
		});
		if (req.ok) {
			const response = await req.json();
			const prNodes = response.data.search.nodes;
			this.prs = prNodes.map((node) => {
				const pr = {
					number: node.number,
					repo: node.repository.name,
					title: node.title
				};
				return pr;
			});
		}
	}
});
