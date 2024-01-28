import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
const SequentTree = ({ data }) => {
  const d3Container = useRef(null);
    
  
  const createTree = (data, container) => {
      const width = 800;  // Set the width of the tree
      const height = 500; // Set the height of the tree

      // Create the tree layout
      const treeLayout = d3.tree().size([height, width]);
      const root = d3.hierarchy(data);
      treeLayout(root);

      // Clear any existing content in the container
      d3.select(container).selectAll("*").remove();

      const svg = d3.select(container).append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(40,0)"); // Adjust as needed

      // Add links (lines connecting nodes)
      svg.selectAll(".link")
    .data(root.descendants().slice(1))
    .enter().append("path")
    .attr("class", "link")
    .attr("d", d => `M${d.y},${d.x}C${(d.y + d.parent.y) / 2},${d.x} ${(d.y + d.parent.y) / 2},${d.parent.x} ${d.parent.y},${d.parent.x}`);

      // Add nodes
      const node = svg.selectAll(".node")
    .data(root.descendants())
    .enter().append("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.y},${d.x})`);

      // Add circles to nodes
      node.append("circle")
    .attr("r", 10); // Adjust radius as needed

      // Add text to nodes
      node.append("text")
    .attr("dy", ".35em")
    .attr("x", d => d.children ? -13 : 13)
    .style("text-anchor", d => d.children ? "end" : "start")
    .text(d => d.data.name); // Adjust to display sequent text
  };
  
  useEffect(() => {
    if (d3Container.current) {
      createTree(data, d3Container.current);
    }
  }, [data]);

  return (
    <div ref={d3Container} />
  );
};

export default SequentTree;